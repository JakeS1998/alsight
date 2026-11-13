import {pathwayContractorFee} from './asePathwayFee.ts';
import {pathwayAppointmentFee} from './asePathwayAppointmentFee.ts';
import {dmaTermsForContract,readVigoDMAEvidence} from './vigoDMAAttribution.ts';
import {scopedReadCache} from './scopedReadCache.ts';
export async function contractProjectTerms(base44,contracts,account,dmaEvidence=null) {
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
  const evidences=new Map();
   if(account && projects.length && base44.asServiceRole){
     const saved=await base44.asServiceRole.entities.DMAFeeExtraction.filter({project_id:{$in:projects.map(p=>p.id)},status:'ready'},{limit:80,fields:['project_id']});
     if(saved.has_more)throw new Error('DMA evidence exceeds the safe project page.');
     const available=[...new Set(saved.items.map(r=>r.project_id))],user=available.length ? await base44.auth.me() : null;
     for(let offset=0;offset<available.length;offset+=3)await Promise.all(available.slice(offset,offset+3).map(async id=>{
       const evidence=dmaEvidence?.project_id===id ? dmaEvidence : await scopedReadCache(`dma-portfolio:${user.id}:${user.role}:${account.id}:${id}`,()=>readVigoDMAEvidence(base44,account,false,id));
       evidences.set(id,evidence);
     }));
   }
   return contracts.map(contract=>{
    const matches=projects.filter(row=>row.id===contract.project_id || row.dataverse_id===contract.project_id);
    if(matches.length!==1) return contract;
    const project=matches[0],terms=delivery.items.filter(row=>[project.id,project.dataverse_id].includes(row.project_id));
    const current=proposals.items.filter(row=>[project.id,project.dataverse_id].includes(row.project_id));
    const pathway=account && terms.length===1 && current.length===1 ? (contract.document_type ? pathwayAppointmentFee(terms[0],current[0],account,contract.document_type) : pathwayContractorFee(terms[0],current[0],account)) : null;
    const evidence=evidences.get(project.id) || (dmaEvidence?.project_id===project.id ? dmaEvidence : null);
    const dma=current.length===0 ? dmaTermsForContract(evidence,contract) : null;
    return {...contract,project_name:project.name,project_record_id:project.id,pathway_terms:pathway,dma_terms:dma,...(terms.length===1 ? {recorded_terms:{value:terms[0].contract_sum,start:terms[0].contract_start,end:terms[0].forecast_pc || terms[0].original_pc,programme_record_id:terms[0].id,date_source:terms[0].forecast_pc ? 'Project delivery: contract start to forecast practical completion' : 'Project delivery: contract start to original practical completion',source:'Recorded project contract sum requires company-specific value review; programme dates may be used as an explicitly labelled proxy when contract dates are unknown.'}} : {})};
  });
}