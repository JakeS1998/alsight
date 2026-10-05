import {pathwayContractorFee} from './asePathwayFee.ts';
export async function contractProjectTerms(base44,contracts,account) {
  const refs=[...new Set(contracts.map(row=>row.project_id).filter(Boolean))];
  if(!refs.length) return contracts;
  const fields=['name','dataverse_id'];
  const native=refs.filter(ref=>/^[a-f0-9]{24}$/i.test(ref));
  const [legacy,local]=await Promise.all([base44.entities.Project.filter({dataverse_id:{$in:refs}},{limit:40,fields}),native.length ? base44.entities.Project.filter({id:{$in:native}},{limit:40,fields}) : {items:[]}]);
  const projects=[...new Map([...legacy.items,...local.items].map(row=>[row.id,row])).values()];
  const aliases=projects.flatMap(row=>[row.id,row.dataverse_id].filter(Boolean));
  const [delivery,proposals]=aliases.length ? await Promise.all([
    base44.entities.ProjectDelivery.filter({project_id:{$in:aliases}},{limit:40,fields:['project_id','contract_sum','contract_start','forecast_pc','original_pc','delivery_team']}),
    account ? base44.entities.FeeProposal.filter({project_id:{$in:aliases},is_current:true,status:{$ne:'lost'}},{limit:40,fields:['project_id','revision_number','status','ohp_surveys_pct','ohp_riba57_pct','ohp_surveys_type','ohp_surveys_fixed']}) : {items:[]}
  ]) : [{items:[]},{items:[]}];
  if(delivery.has_more || proposals.has_more) throw new Error('Too many current Pathway records for this contract page; resolve duplicate delivery records or proposal revisions.');
  return contracts.map(contract=>{
    const matches=projects.filter(row=>row.id===contract.project_id || row.dataverse_id===contract.project_id);
    if(matches.length!==1) return contract;
    const project=matches[0],terms=delivery.items.filter(row=>[project.id,project.dataverse_id].includes(row.project_id));
    const current=proposals.items.filter(row=>[project.id,project.dataverse_id].includes(row.project_id));
    const pathway=account && terms.length===1 && current.length===1 ? pathwayContractorFee(terms[0],current[0],account) : null;
    return {...contract,project_name:project.name,project_record_id:project.id,pathway_terms:pathway,...(terms.length===1 ? {recorded_terms:{value:terms[0].contract_sum,start:terms[0].contract_start,end:terms[0].forecast_pc || terms[0].original_pc,programme_record_id:terms[0].id,date_source:terms[0].forecast_pc ? 'Project delivery: contract start to forecast practical completion' : 'Project delivery: contract start to original practical completion',source:'Recorded project contract sum requires company-specific value review; programme dates may be used as an explicitly labelled proxy when contract dates are unknown.'}} : {})};
  });
}