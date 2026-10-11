import { capacityScope } from './deliveryCapacityScope.ts';
import { capacityProjectFields, projectCommitments, classifyCapacity } from './deliveryCapacitySignals.ts';
import { capacitySupplierAssignments } from './capacitySupplierAssignments.ts';
import { scopedReadCache } from './scopedReadCache.ts';
import { projectCapacityHeatmap } from './projectCapacityHeatmap.ts';
import { capacityOrganisationReport } from './capacityOrganisationReport.ts';
import { capacityVisibleIds } from './capacityVisibleDetails.ts';

export async function deliveryCapacityReport(db,user,input,detailDb=null) {
  if(!detailDb && input.action!=='intelligence' && Array.isArray(input.projectIds) && !input.projectIds.length)return {today:new Date().toISOString().slice(0,10),active:0,assigned:0,concentrated:0,upcoming:0,unassigned:0,missingProgramme:0,missingStart:0,people:[],windows:['0–30 days','31–60 days','61–90 days'].map(label=>({label,projects:0,starts:0})),commitments:[],nextOffset:null,context:null,assignmentPage:input.action==='projects' ? {items:[],has_more:false} : null};
  const {query}=await capacityScope(db,user,input,!!detailDb);
  const cacheKey=JSON.stringify([detailDb ? 'organisation-totals-v1' : 'rls',user.id,user.role,user.region,user.data,user.staff_aad_id,user.delegate_of,query,new Date().toISOString().slice(0,10),input.filters || {},input.revision || null]);
  const read=(key,load)=>scopedReadCache(`capacity:suppliers:v1:${cacheKey}:${key}`,load);
  const result=await read('projects:v3',()=>db.Project.aggregate({query,groupBy:'id',max:capacityProjectFields.filter(field=>field!=='id'),limit:1000}));
  if(result.truncated)throw new Error('Capacity reporting exceeds its grouping limit. Narrow the portfolio filters.');
  const projects=result.rows.map(row=>({id:row.id,count:row.count,...Object.fromEntries(capacityProjectFields.filter(field=>field!=='id').map(field=>[field,row[`max_${field}`]]))}));
  const visibleProjectIds=detailDb ? await capacityVisibleIds(detailDb,'Project',projects.map(project=>project.id)) : new Set(projects.map(project=>project.id));
  const ids=projects.flatMap(p=>[p.id,p.dataverse_id]).filter(Boolean);
  const delivery=ids.length ? await read('programme:v2',()=>db.ProjectDelivery.aggregate({query:{project_id:{$in:ids}},groupBy:['project_id','updated_date'],max:['contract_start','forecast_pc','original_pc','pc_achieved','delivery_team'],limit:1000})) : {rows:[]};
  if(delivery.truncated)throw new Error('Programme reporting exceeds its grouping limit. Narrow the portfolio filters.');
  const latest=new Map();
  for(const group of delivery.rows){const row={project_id:group.project_id,updated_date:group.updated_date,...Object.fromEntries(['contract_start','forecast_pc','original_pc','pc_achieved','delivery_team'].map(field=>[field,group[`max_${field}`]]))};const old=latest.get(row.project_id);if(!old || String(row.updated_date)>String(old.updated_date))latest.set(row.project_id,row);}
  if(input.action==='intelligence')return capacityOrganisationReport(db,user,input,projects,latest,read,visibleProjectIds,detailDb);
  const suppliers=await capacitySupplierAssignments(db,projects,latest,read),owners=new Map(),today=new Date().toISOString().slice(0,10),commitments=[],allocations=[];
  let unassigned=0,missingProgramme=0,missingStart=0;
  for(const project of projects){
    const candidates=[latest.get(project.id),latest.get(project.dataverse_id)].filter(Boolean).sort((a,b)=>String(b.updated_date).localeCompare(String(a.updated_date)));
    const path=candidates[0],signals=projectCommitments(project,path,today),members=suppliers.get(project.id) || [];
    if(!signals.evidence)missingProgramme+=project.count;
    if(!path?.contract_start)missingStart+=project.count;
    if(!members.length)unassigned+=project.count;
    if(input.projectId)allocations.push({id:project.id,count:project.count,members,...signals});
    const commitment={id:project.id,name:project.name || 'Project',supplierNames:members.map(member=>member.name),people:members.map(member=>member.key),events:signals.events};
    if(signals.events.length)commitments.push(commitment);
    for(const member of members){
      const owner=owners.get(member.key) || {...member,roles:new Set(),active:0,near:0,demanding:0,evidence:0,months:new Map(),projectIds:[]};
      member.roles.forEach(role=>owner.roles.add(role));owner.active+=project.count;owner.projectIds.push(project.id);
      owner.near+=signals.events.some(event=>Date.parse(event.date)-Date.parse(today)<=30*86400000) ? project.count : 0;
      owner.demanding+=signals.demanding ? project.count : 0;owner.evidence+=signals.evidence ? project.count : 0;
      for(const month of new Set(signals.events.map(event=>event.date.slice(0,7)))){const set=owner.months.get(month) || new Set();set.add(project.id);owner.months.set(month,set);}
      owners.set(member.key,owner);
    }
  }
  const distribution=classifyCapacity([...owners.values()]).map(company=>({key:company.key,name:company.name,accountId:company.accountId,active:company.active,near:company.near,demanding:company.demanding,classification:company.classification,signals:company.signals,clashes:[...company.months].filter(([,set])=>set.size>1).map(([month,set])=>({month,count:set.size}))})).sort((a,b)=>b.active-a.active || a.name.localeCompare(b.name));
  const windows=[[0,30],[30,60],[60,90]].map(([from,to])=>{const inWindow=event=>{const days=(Date.parse(event.date)-Date.parse(today))/86400000;return (from===0 ? days>=0 : days>from) && days<=to;};return {label:from===0 ? '0–30 days' : `${from+1}–${to} days`,projects:commitments.filter(project=>project.events.some(inWindow)).length,starts:commitments.filter(project=>project.events.some(event=>event.label==='Construction start' && inWindow(event))).length};});
  const contextProject=projects.find(project=>project.id===input.projectId && visibleProjectIds.has(project.id));
  let context=null;
  if(contextProject){
    const entry=commitments.find(commitment=>commitment.id===contextProject.id),months=new Set(entry?.events.map(event=>event.date.slice(0,7)));
    context={events:entry?.events || [],dependencies:(suppliers.get(contextProject.id) || []).map(member=>{
      const company=owners.get(member.key);
      return {key:member.key,name:company.name,accountId:company.accountId,roles:member.roles,active:company.active,related:commitments.filter(commitment=>visibleProjectIds.has(commitment.id) && commitment.id!==contextProject.id && commitment.people.includes(member.key) && commitment.events.some(event=>months.has(event.date.slice(0,7)))).slice(0,5).map(commitment=>({id:commitment.id,name:commitment.name}))};
    })};
  }
  const heatmap=input.projectId ? projectCapacityHeatmap(allocations,input.projectId,owners,new Set(owners.keys()),today) : null;
  const cutoff=new Date(Date.parse(today)+(input.days || 30)*86400000).toISOString().slice(0,10);
  const matching=commitments.filter(row=>visibleProjectIds.has(row.id) && (!input.person || row.people.includes(input.person)) && row.events.some(e=>e.date<=cutoff)).sort((a,b)=>a.events[0].date.localeCompare(b.events[0].date) || a.name.localeCompare(b.name));
  const offset=input.offset || 0;
  const selectedOwner=input.person ? owners.get(input.person) : null;
  let assignmentPage=null;
  if(input.action==='projects'){
    // The authorised aggregate already supplies supplier project IDs and names.
    const projectIndex=new Map(projects.map(project=>[project.id,project]));
    const rows=(selectedOwner?.projectIds || []).filter(id=>visibleProjectIds.has(id)).map(id=>projectIndex.get(id)).filter(Boolean).sort((a,b)=>String(a.name || '').localeCompare(String(b.name || '')) || a.id.localeCompare(b.id));
    const start=/^supplier-offset:\d+$/.test(input.cursor || '') ? Number(input.cursor.slice(16)) : 0;
    const hasMore=start+10<rows.length;
    assignmentPage={items:rows.slice(start,start+10).map(project=>({id:project.id,name:project.name})),has_more:hasMore,next_cursor:hasMore ? `supplier-offset:${start+10}` : null};
  }
  return {today,scope:detailDb ? 'organisation-totals' : 'rls',detailScope:'rls',active:projects.reduce((n,p)=>n+p.count,0),assigned:owners.size,concentrated:distribution.filter(p=>p.classification==='Concentrated').length,upcoming:commitments.length,unassigned,missingProgramme,missingStart,people:distribution,windows,commitments:matching.slice(offset,offset+10),nextOffset:offset+10<matching.length ? offset+10 : null,context,assignmentPage,heatmap};
}