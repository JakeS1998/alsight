const monthLabel=month=>new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});
const share=(value,total)=>total>0 ? ` (${Math.round(value/total*100)}% of this role's scope)` : '';
export function capacityManagementConsiderations(roleRows,totals,today,projectIds,opportunityIds) {
  const people=new Map(),cutoff=new Date(Date.parse(today)+30*86400000).toISOString().slice(0,10);
  for(const role of ['bdm','bsm'])for(const owner of roleRows[role]){
    const person=people.get(owner.key) || {name:owner.name,roles:[],records:new Map()};
    person.roles.push({role,owner});
    for(const record of owner.records)person.records.set(record.href,record);
    people.set(owner.key,person);
  }
  const insights=[];
  for(const [key,person] of people){
    const records=[...person.records.values()],projects=records.filter(record=>record.kind==='project'),months=new Map();
    for(const project of projects)for(const month of new Set(project.events.map(event=>event.date.slice(0,7)))){
      const ids=months.get(month) || new Set();ids.add(project.id);months.set(month,ids);
    }
    const overlaps=[...months].filter(([,ids])=>ids.size>1).sort(([a],[b])=>a.localeCompare(b));
    const concentrated=person.roles.filter(({owner})=>['Concentrated','Potential dependency'].includes(owner.classification));
    if(!concentrated.length && !overlaps.length)continue;
    const near=projects.filter(project=>project.events.some(event=>event.date>=today && event.date<=cutoff)).length;
    const findings=person.roles.map(({role,owner})=>({label:`${role.toUpperCase()} responsibilities`,text:`${owner.projects} live projects${share(owner.projects,totals[role].projects)}; ${owner.near} with milestones in 30 days; ${owner.demanding} in late design / construction. ${role==='bdm' ? `${owner.opportunities} active opportunities${share(owner.opportunities,totals.bdm.opportunities)}.` : `${owner.administration} outstanding documents, ${owner.dueDocuments} dated within 90 days; ${owner.dueWarranties} warranties due within 90 days.`}`}));
    for(const {role,owner} of concentrated){
      const measures=role==='bdm' ? [['projects','projects'],['opportunities','active opportunities'],['pipelineValue','recorded pipeline value']] : [['projects','projects'],['administration','outstanding documents']];
      const majority=measures.filter(([field])=>owner[field]>0 && owner[field]>totals[role][field]-owner[field]).map(([,label])=>label);
      findings.push({label:`${role.toUpperCase()} concentration`,text:`Owns more ${majority.join(' and ')} than the rest of this role's scope combined.${owner.classification==='Potential dependency' ? ` ${owner.exclusiveClients.length} clients have repeated records attributed solely to this person in this role; cover is not evidenced here.` : ''}`});
    }
    if(overlaps.length)findings.push({label:'Milestone coordination',text:overlaps.map(([month,ids])=>`${ids.size} distinct projects in ${monthLabel(month)}`).join('; ')+'. Projects are counted once even when this person is both BDM and BSM.'});
    const actions=[];
    if(concentrated.length)actions.push(`Confirm shared ownership and named cover for ${concentrated.map(({role})=>role.toUpperCase()).join(' / ')} responsibilities, especially repeated client relationships.`);
    if(overlaps.length)actions.push(`Review the ${monthLabel(overlaps[0][0])} milestone sequence first and agree priorities and support across the overlapping projects.`);
    const coordinatedIds=new Set(overlaps.flatMap(([,ids])=>[...ids]));
    const accessible=records.filter(record=>record.kind==='project' ? projectIds.has(record.id) : opportunityIds.has(record.id)).sort((a,b)=>Number(coordinatedIds.has(b.id))-Number(coordinatedIds.has(a.id)) || a.label.localeCompare(b.label));
    insights.push({key:`person:${key}`,title:`${person.name}: ${concentrated.length ? 'continuity & workload review' : 'milestone coordination'}`,personKey:key,summary:`${person.roles.map(({role})=>role.toUpperCase()).join(' / ')} · ${projects.length} distinct projects · ${near} with milestones in 30 days`,findings,identified:findings.map(finding=>`${finding.label}: ${finding.text}`).join(' '),why:'Recorded ownership and milestones highlight continuity and coordination needs, not effort, performance, spare capacity or confirmed diary clashes.',review:actions.join(' '),records:accessible.slice(0,3).map(({id,label,href})=>({id,label,href}))});
  }
  return insights.sort((a,b)=>a.title.localeCompare(b.title));
}