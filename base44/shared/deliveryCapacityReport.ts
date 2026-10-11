import { capacityScope } from './deliveryCapacityScope.ts';
import { capacityProjectFields, assignmentFields, projectCommitments, classifyCapacity } from './deliveryCapacitySignals.ts';
import { capacityPeople } from './deliveryCapacityPeople.ts';
import { scopedReadCache } from './scopedReadCache.ts';
import { projectCapacityHeatmap } from './projectCapacityHeatmap.ts';
const roleNames=['Project manager','BDM','BSM','Director','Strategic account manager'];
export async function deliveryCapacityReport(db,user,input) {
  if(Array.isArray(input.projectIds) && !input.projectIds.length)return {today:new Date().toISOString().slice(0,10),active:0,assigned:0,concentrated:0,upcoming:0,unassigned:0,missingProgramme:0,missingStart:0,people:[],windows:['0–30 days','31–60 days','61–90 days'].map(label=>({label,projects:0,starts:0})),commitments:[],nextOffset:null,context:null,assignmentPage:input.action==='projects' ? {items:[],has_more:false} : null};
  const {query,identity}=await capacityScope(db,user,input);
  const cacheKey=JSON.stringify([user.id,user.role,user.region,user.data,user.staff_aad_id,user.delegate_of,query,new Date().toISOString().slice(0,10)]);
  const read=(key,load)=>scopedReadCache(`capacity:${cacheKey}:${key}`,load);
  const result=await read('projects:v2',()=>db.Project.aggregate({query,groupBy:'id',max:capacityProjectFields.filter(field=>field!=='id'),limit:1000}));
  if(result.truncated)throw new Error('Capacity reporting exceeds its grouping limit. Narrow the portfolio filters.');
  const projects=result.rows.map(row=>({id:row.id,count:row.count,...Object.fromEntries(capacityProjectFields.filter(field=>field!=='id').map(field=>[field,row[`max_${field}`]]))}));
  const ids=projects.flatMap(p=>[p.id,p.dataverse_id]).filter(Boolean);
  const delivery=ids.length ? await read('programme:v2',()=>db.ProjectDelivery.aggregate({query:{project_id:{$in:ids}},groupBy:['project_id','updated_date'],max:['contract_start','forecast_pc','original_pc','pc_achieved'],limit:1000})) : {rows:[]};
  if(delivery.truncated)throw new Error('Programme reporting exceeds its grouping limit. Narrow the portfolio filters.');
  const latest=new Map();
  for(const group of delivery.rows){const row={project_id:group.project_id,updated_date:group.updated_date,...Object.fromEntries(['contract_start','forecast_pc','original_pc','pc_achieved'].map(field=>[field,group[`max_${field}`]]))};const old=latest.get(row.project_id);if(!old || String(row.updated_date)>String(old.updated_date))latest.set(row.project_id,row);}
  const people=await read('contact-people:v2',()=>capacityPeople(db,user,projects)),owners=new Map(),today=new Date().toISOString().slice(0,10),commitments=[];
  const allocations=[];
  let unassigned=0,missingProgramme=0,missingStart=0;
  for(const project of projects){
    const candidates=[latest.get(project.id),latest.get(project.dataverse_id)].filter(Boolean).sort((a,b)=>String(b.updated_date).localeCompare(String(a.updated_date)));
    const path=candidates[0],signals=projectCommitments(project,path,today);
    if(!signals.evidence)missingProgramme+=project.count;
    if(!path?.contract_start)missingStart+=project.count;
    if(!project.project_manager_id)unassigned+=project.count;
    const members=new Map();
    assignmentFields.forEach((field,index)=>{const id=project[field];if(!id)return;const person=people.get(id) || {key:id,name:'Assigned person (identity unresolved)',resolved:false};const entry=members.get(person.key) || {...person,roles:[]};entry.roles.push(roleNames[index]);members.set(person.key,entry);});
    if(input.projectId)allocations.push({id:project.id,count:project.count,members:[...members.values()],...signals});
    const manager=project.project_manager_id ? people.get(project.project_manager_id) : null;
    const commitment={id:project.id,name:project.name || 'Project',managerName:manager?.name,people:[...members.keys()],events:signals.events};
    if(signals.events.length)commitments.push(commitment);
    for(const member of members.values()){
      const owner=owners.get(member.key) || {...member,roles:new Set(),active:0,managed:0,near:0,demanding:0,evidence:0,months:new Map(),projectIds:[]};
      member.roles.forEach(role=>owner.roles.add(role));owner.active+=project.count;owner.projectIds.push(project.id);
      if(member.roles.includes('Project manager'))owner.managed+=project.count;
      owner.near+=signals.events.some(e=>Date.parse(e.date)-Date.parse(today)<=30*86400000) ? project.count : 0;
      owner.demanding+=signals.demanding ? project.count : 0;owner.evidence+=signals.evidence ? project.count : 0;
      for(const month of new Set(signals.events.map(e=>e.date.slice(0,7)))){const set=owner.months.get(month) || new Set();set.add(project.id);owner.months.set(month,set);}
      owners.set(member.key,owner);
    }
  }
  const managerOwners=[...owners.values()].filter(p=>p.managed>0);
  // Distribution measures PM assignments only; other responsibilities remain context, not added project weight.
  const managerGroups=managerOwners.map(owner=>{const managerIds=new Set(projects.filter(p=>p.project_manager_id && (people.get(p.project_manager_id)?.key || p.project_manager_id)===owner.key).map(p=>p.id));const rows=projects.filter(p=>managerIds.has(p.id));let near=0,demanding=0,evidence=0;for(const p of rows){const path=latest.get(p.id) || latest.get(p.dataverse_id);const s=projectCommitments(p,path,today);near+=s.events.some(e=>Date.parse(e.date)-Date.parse(today)<=30*86400000) ? p.count : 0;demanding+=s.demanding ? p.count : 0;evidence+=s.evidence ? p.count : 0;}const months=new Map([...owner.months].map(([month,set])=>[month,new Set([...set].filter(id=>managerIds.has(id)))]));return {...owner,active:owner.managed,near,demanding,evidence,months};});
  const distribution=classifyCapacity(managerGroups).map(p=>({key:p.key,name:p.name,contactId:p.contactId,photo:p.photo,active:p.active,near:p.near,demanding:p.demanding,classification:p.classification,signals:p.signals,clashes:[...p.months].filter(([,set])=>set.size>1).map(([month,set])=>({month,count:set.size}))})).sort((a,b)=>b.active-a.active || a.name.localeCompare(b.name));
  const windows=[[0,30],[30,60],[60,90]].map(([from,to])=>{const inWindow=e=>{const days=(Date.parse(e.date)-Date.parse(today))/86400000;return (from===0 ? days>=0 : days>from) && days<=to;};return {label:from===0 ? '0–30 days' : `${from+1}–${to} days`,projects:commitments.filter(p=>p.events.some(inWindow)).length,starts:commitments.filter(p=>p.events.some(e=>e.label==='Construction start' && inWindow(e))).length};});
  const contextProject=projects.find(p=>p.id===input.projectId);
  let context=null;
  if(contextProject){const entry=commitments.find(c=>c.id===contextProject.id);const months=new Set(entry?.events.map(e=>e.date.slice(0,7)));const keys=assignmentFields.map(field=>contextProject[field]).filter(Boolean).map(id=>people.get(id)?.key || id);const ownKeys=new Set(identity.map(id=>people.get(id)?.key || id));context={events:entry?.events || [],dependencies:[...new Set(keys)].filter(key=>['admin','director','regional_director'].includes(user.role) || ownKeys.has(key)).map(key=>{const person=owners.get(key);return {key,name:person.name,roles:[...person.roles],active:person.active,related:commitments.filter(c=>c.id!==contextProject.id && c.people.includes(key) && c.events.some(e=>months.has(e.date.slice(0,7)))).slice(0,5).map(c=>({id:c.id,name:c.name}))};})};}
  const allowedKeys=new Set(['admin','director','regional_director'].includes(user.role) ? [...owners.keys()] : identity.map(id=>people.get(id)?.key || id));
  const heatmap=input.projectId ? projectCapacityHeatmap(allocations,input.projectId,owners,allowedKeys,today) : null;
  const cutoff=new Date(Date.parse(today)+(input.days || 30)*86400000).toISOString().slice(0,10);
  const matching=commitments.filter(row=>(!input.person || row.people.includes(input.person)) && row.events.some(e=>e.date<=cutoff)).sort((a,b)=>a.events[0].date.localeCompare(b.events[0].date) || a.name.localeCompare(b.name));
  const offset=input.offset || 0;
  const selectedOwner=input.person ? owners.get(input.person) : null;
  let assignmentPage=null;
  if(input.action==='projects') assignmentPage=await db.Project.filter({$and:[query,{id:{$in:selectedOwner?.projectIds || []}}]},{sort:'name',limit:10,fields:['name'],...(input.cursor ? {cursor:input.cursor} : {})});
  return {today,active:projects.reduce((n,p)=>n+p.count,0),assigned:owners.size,concentrated:distribution.filter(p=>p.classification==='Concentrated').length,upcoming:commitments.length,unassigned,missingProgramme,missingStart,people:distribution,windows,commitments:matching.slice(offset,offset+10),nextOffset:offset+10<matching.length ? offset+10 : null,context,assignmentPage,heatmap};
}