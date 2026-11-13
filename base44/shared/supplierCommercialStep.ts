import {commercialInsight} from './aseCommercialInsight.ts';
import {commercialTurnover} from './aseCommercialTurnover.ts';
import {collectASESource} from './aseCollectSource.ts';
import {accountModel} from './asePolicy.ts';
import {kickSupplierCommercialCheck} from './supplierCommercialQueue.ts';
import {supplierAppointmentStep} from './supplierAppointmentStep.ts';
export async function supplierCommercialStep(base44,user,input){
 const db=base44.asServiceRole.entities,job=await db.SupplierCommercialCheck.get(input.jobId);
 if(job.status!=='queued'||!job.token||job.token!==input.token)return {skipped:true};
 const claim=crypto.randomUUID();
 await db.SupplierCommercialCheck.updateMany({id:job.id,status:'queued',token:job.token},{$set:{status:'processing',token:claim,claimed_at:new Date().toISOString()}});
 if((await db.SupplierCommercialCheck.get(job.id)).token!==claim)return {skipped:true};
 try {
  let account=await base44.entities.Account.get(job.account_id);
  if(job.stage==='accounts'){
   let note='';
   if(account.company_number&&accountModel(account)!=='english_local_authority'){
    if(!accountModel(account)&&!account.organisation_type){
     try{await collectASESource(base44,account,'registry',user);account=await base44.entities.Account.get(account.id);}catch(error){note=String(error.message).slice(0,500);}
    }
    if(accountModel(account)==='company'){
     const comparison=await commercialTurnover(base44,account);
     if(comparison.status!=='available'&&!comparison.balance_sheet_proxy){
      try{await collectASESource(base44,account,'accounts',user);}catch(error){note=[note,String(error.message).slice(0,500)].filter(Boolean).join(' ');}
     }
    }
   }
   await db.SupplierCommercialCheck.update(job.id,{status:'queued',stage:'appointments',token:crypto.randomUUID(),note});
   return {continuing:true};
  }
  if(job.stage==='appointments'||!job.appointments_checked)return await supplierAppointmentStep(base44,user,job,account);
  const data=await commercialInsight(base44,account);
  await db.SupplierCommercialCheck.update(job.id,{status:'completed',token:'',checked_at:data.checked_at,concentration_status:data.status,percentage:data.percentage??null,contract_value:data.total_contract_value??null,comparison_basis:data.comparison_basis || '',comparison_value:data.comparison_denominator?.value??null,included_count:data.included_count || 0,excluded_count:data.excluded_count || 0,note:[job.note,data.reason].filter(Boolean).join(' ').slice(0,2000)});
 }catch(error){await db.SupplierCommercialCheck.update(job.id,{status:'blocked',token:'',note:String(error.message).replace(/https:\/\/\S+/g,'[source link]').slice(0,2000)});}
 await kickSupplierCommercialCheck(base44);return {finished:true};
}