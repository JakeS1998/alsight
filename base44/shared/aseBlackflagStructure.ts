export function blackflagStructure(nodes,currentId,report,ancestorIds,warnings) {
  if(!report.data) {warnings.push(report.reason);return;}
  const current=nodes.find(node=>node.id===currentId),pscs=(Array.isArray(report.data.company.pscs) ? report.data.company.pscs : []).filter(row=>!row.ceased_on && typeof row.name==='string' && row.name.trim()).slice(0,40);
  const corporate=row=>row.kind==='corporate-entity-person-with-significant-control' && /^\d{8}$/.test(row.corporate_number || '');
  const controls=row=>(Array.isArray(row.nature_of_control) ? row.nature_of_control : []).filter(value=>typeof value==='string').slice(0,10);
  const majority=pscs.filter(row=>corporate(row) && controls(row).some(value=>/^ownership-of-shares-(?:50-to-75|75-to-100)-percent$/.test(value)));
  for(const [index,row] of pscs.entries()) {
    const parent=majority.length===1 && row===majority[0];
    let node=corporate(row) ? nodes.find(node=>node.company_number===row.corporate_number && node.id!==currentId) : null;
    if(!node) {node={id:`blackflag-psc:${currentId}:${index}`,name:row.name.slice(0,200),company_number:corporate(row) ? row.corporate_number : null,parentId:parent ? null : currentId,external:true};nodes.push(node);}
    Object.assign(node,{relationship:parent ? 'Blackflag-reported controlling parent · Corporate PSC' : corporate(row) ? 'Corporate PSC' : 'Person with significant control',controls:controls(row),notified_on:row.notified_on || null,source_reference:report.url,source_label:'Blackflag Alert',retrieved_at:report.audit.refreshed_at});
    if(parent) {
      if(current.parentId && current.parentId!==node.id) warnings.push('Blackflag’s controlling parent differs from the recorded account parent. Both source records remain visible; the Blackflag link is shown for this company.');
      // Never introduce a cycle when a reported controller is already a recorded descendant.
      let ref=node;const seen=new Set();
      while(ref?.parentId && !seen.has(ref.id)) {seen.add(ref.id);ref=nodes.find(item=>item.id===ref.parentId);}
      if(ref?.id===currentId) {warnings.push('A Blackflag control link conflicts with the recorded tree and was not applied.');continue;}
      current.parentId=node.id;if(!ancestorIds.includes(node.id)) ancestorIds.push(node.id);
    }
  }
  warnings.push(`Blackflag ownership snapshot retrieved ${report.audit.refreshed_at}. PSC control bands are not exact shareholdings; this is not a complete or independently verified beneficial-ownership chain.`);
  if(!pscs.length) warnings.push('No current PSC entries are present in this saved Blackflag report; this does not prove there are no PSCs.');
  if((report.data.company.pscs || []).length>40) warnings.push('Only the first 40 current PSC entries are displayed.');
}