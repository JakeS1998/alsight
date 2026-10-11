export function capacityResponsibilityCriteria(owners,totals,clients) {
  const peers=owners.filter(owner=>owner.resolved && (owner.projects || owner.opportunities));
  return owners.map(owner=>{
    const reasons=[];
    for(const [field,label] of [['projects','live project responsibilities'],['opportunities','active opportunity ownership'],['pipelineValue','recorded pipeline value'],['administration','outstanding document responsibilities']]){
      const value=owner[field] || 0,total=totals[field] || 0;
      if(value>0 && value>total-value)reasons.push(`${value.toLocaleString('en-GB')} of ${total.toLocaleString('en-GB')} ${label}: more than the rest of the organisation-wide selection combined.`);
    }
    const exclusive=[...clients.values()].filter(client=>client.records.length>1 && client.owners.size===1 && client.owners.has(owner.key));
    const sufficient=owner.resolved && peers.length>=2;
    const classification=!sufficient ? 'Insufficient information' : reasons.length && exclusive.length ? 'Potential dependency' : reasons.length ? 'Concentrated' : 'Balanced';
    if(!sufficient)reasons.unshift(!owner.resolved ? 'Staff identity is missing or ambiguous.' : 'Fewer than two identifiable colleagues with recorded responsibilities in this role; a distribution comparison is not meaningful.');
    else if(!reasons.length)reasons.push('No majority concentration in the measured responsibilities within this organisation-wide selection. This does not confirm equal effort or spare capacity.');
    if(classification==='Potential dependency')reasons.push(`${exclusive.length} client relationship(s) have repeated live records attributed solely to this person in this role. Deputy / cover arrangements are not recorded here; review continuity rather than assume absence of cover.`);
    const months=new Map();
    for(const record of owner.records.filter(record=>record.kind==='project'))for(const month of new Set(record.events.map(event=>event.date.slice(0,7)))){const entries=months.get(month) || [];entries.push({id:record.id,label:record.label,href:record.href});months.set(month,entries);}
    return {...owner,classification,reasons,clients:owner.clientIds.size,regions:[...owner.regionCounts].map(([id,count])=>({id,count})),overlaps:[...months].filter(([,records])=>records.length>1).map(([month,records])=>({month,projects:records.length,records:records.slice(0,3)})),records:owner.records,exclusiveClients:exclusive.map(client=>({label:client.label,records:client.records.slice(0,3)}))};
  }).sort((a,b)=>a.name.localeCompare(b.name));
}