const windows=[[0,30],[30,60],[60,90]];
const median=values=>{const sorted=values.sort((a,b)=>a-b),n=sorted.length;return n ? (sorted[Math.floor((n-1)/2)]+sorted[Math.ceil((n-1)/2)])/2 : 0;};
export function projectCapacityHeatmap(allocations, projectId, owners, allowedKeys, today) {
  const current=allocations.find(row=>row.id===projectId);
  if(!current)return {rows:[],reason:'This project is outside the active project scope, so there is no current allocation comparison.'};
  const groups=new Map();
  for(const allocation of allocations)for(const member of allocation.members)for(const role of member.roles){
    const key=member.key+'|'+role;
    const group=groups.get(key) || {key,personKey:member.key,role,active:0,demanding:0,evidence:0,windows:[0,0,0]};
    group.active+=allocation.count;group.demanding+=allocation.demanding ? allocation.count : 0;group.evidence+=allocation.evidence ? allocation.count : 0;
    windows.forEach(([from,to],index)=>{if(allocation.events.some(event=>{const days=(Date.parse(event.date)-Date.parse(today))/86400000;return (from===0 ? days>=0 : days>from) && days<=to;}))group.windows[index]+=allocation.count;});
    groups.set(key,group);
  }
  const rows=[];
  for(const member of current.members.filter(member=>allowedKeys.has(member.key)))for(const role of member.roles){
    const own=groups.get(member.key+'|'+role),person=owners.get(member.key);
    const peers=[...groups.values()].filter(group=>group.role===role && owners.get(group.personKey)?.resolved && group.evidence>0);
    const baselines=[median(peers.map(p=>p.active)),median(peers.map(p=>p.demanding)),...windows.map((_,i)=>median(peers.map(p=>p.windows[i])))];
    const sufficient=person.resolved && own.evidence>0 && peers.length>=3;
    const missingProgramme=own.active-own.evidence;
    const cells=[own.active,own.demanding,...own.windows].map((value,index)=>({value,median:baselines[index],level:!sufficient ? 'unknown' : value>baselines[index] ? 'high' : value<baselines[index] && !missingProgramme ? 'low' : 'typical'}));
    const pressure=[cells[0].level==='high',cells[1].level==='high',cells[2].level==='high' && cells[2].value>1].filter(Boolean).length;
    const status=!sufficient ? 'Insufficient information' : pressure>=2 ? 'Possible overload' : pressure ? 'Higher recorded demand' : cells[0].level==='low' ? 'Potential spare capacity' : 'Typical recorded demand';
    rows.push({key:own.key,personKey:member.key,name:person.name,accountId:person.accountId,role,status,cells,missingProgramme,peerCount:peers.length});
  }
  return {rows,reason:rows.length ? null : 'No delivery supplier assignments are available for comparison within your authorised scope.'};
}