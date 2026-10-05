export async function contractProjectTerms(base44,contracts) {
  const refs=[...new Set(contracts.map(row=>row.project_id).filter(Boolean))];
  if(!refs.length) return contracts;
  const fields=['name','dataverse_id'];
  const native=refs.filter(ref=>/^[a-f0-9]{24}$/i.test(ref));
  const [legacy,local]=await Promise.all([base44.entities.Project.filter({dataverse_id:{$in:refs}},{limit:40,fields}),native.length ? base44.entities.Project.filter({id:{$in:native}},{limit:40,fields}) : {items:[]}]);
  const projects=[...new Map([...legacy.items,...local.items].map(row=>[row.id,row])).values()];
  const aliases=projects.flatMap(row=>[row.id,row.dataverse_id].filter(Boolean));
  const delivery=aliases.length ? await base44.entities.ProjectDelivery.filter({project_id:{$in:aliases}},{limit:40,fields:['project_id','contract_sum','contract_start','forecast_pc','original_pc']}) : {items:[]};
  return contracts.map(contract=>{
    const matches=projects.filter(row=>row.id===contract.project_id || row.dataverse_id===contract.project_id);
    if(matches.length!==1) return contract;
    const project=matches[0],terms=delivery.items.filter(row=>[project.id,project.dataverse_id].includes(row.project_id));
    return {...contract,project_name:project.name,project_record_id:project.id,...(terms.length===1 ? {recorded_terms:{value:terms[0].contract_sum,start:terms[0].contract_start,end:terms[0].forecast_pc || terms[0].original_pc,source:'Recorded project delivery contract sum and programme; verify against the signed JCT before including.'}} : {})};
  });
}