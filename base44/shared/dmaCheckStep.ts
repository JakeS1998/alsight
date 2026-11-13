import {extractProjectDMAFees} from './vigoDMAFees.ts';
import {readVigoDMAEvidence} from './vigoDMAAttribution.ts';
import {commercialInsight} from './aseCommercialInsight.ts';
import {commercialTurnover} from './aseCommercialTurnover.ts';
import {collectASESource} from './aseCollectSource.ts';
import {kickDMACheck} from './dmaCheckQueue.ts';
export async function dmaCheckStep(base44,user,input){
 const db=base44.asServiceRole.entities,job=await db.DMACheckJob.get(input.jobId);
 if(job.status!=='queued'||job.token!==input.token||!job.token)return {skipped:true};
 const claim=crypto.randomUUID();
 await db.DMACheckJob.updateMany({id:job.id,status:'queued',token:job.token},{$set:{status:'processing',token:claim,claimed_at:new Date().toISOString()}});
 if((await db.DMACheckJob.get(job.id)).token!==claim)return {skipped:true};
 try {
  if(job.stage==='document'){
   const dma=await base44.entities.DMA.get(job.dma_id);if(dma.executed!=='yes')throw new Error('DMA is no longer marked executed.');
   const page=await base44.entities.Project.filter({$or:[{id:dma.project_id},{dataverse_id:dma.project_id}]},{limit:2});
   if(page.items.length!==1)throw new Error('DMA project is missing or ambiguous.');
   const project=page.items[0],extraction=await extractProjectDMAFees(base44,user,project.id,dma.id);
   if(extraction.status==='processing')throw new Error('Another extraction is already processing this document; review before retrying.');
   if(extraction.status!=='ready')throw new Error(extraction.note || 'No usable Schedule 5 fee rows found.');
   const evidence=await readVigoDMAEvidence(base44,null,false,project.id);
   const ids=[...new Set((evidence?.rows || []).filter(r=>!r.reason&&r.account_id).map(r=>r.account_id))];
   if(!ids.length){await db.DMACheckJob.update(job.id,{status:evidence?.status==='proposal_available'?'completed':'blocked',token:'',extraction_status:extraction.status,note:evidence?.note || 'Extracted fees could not be attributed to unambiguous signed supplier appointments.'});}
   else {await db.DMACheckJob.update(job.id,{project_id:project.id,stage:'accounts',account_ids:ids,account_index:0,extraction_status:extraction.status,status:'queued',token:crypto.randomUUID(),note:'Schedule 5 extracted; refreshing matched company concentration.'});return {continuing:true,accounts:ids.length};}
  }else {
   const account=await base44.entities.Account.get(job.account_ids[job.account_index]),notes=[];
   const turnover=await commercialTurnover(base44,account);
   if(turnover.status!=='available'&&!turnover.balance_sheet_proxy&&account.company_number){try{await collectASESource(base44,account,'accounts',user);}catch(error){notes.push(String(error.message).slice(0,300));}}
   const data=await commercialInsight(base44,account),results=[...(job.results || []),{account_id:account.id,name:account.name,status:data.status,percentage:data.percentage,included:data.included_count,excluded:data.excluded_count,notes}];
   const next=job.account_index+1,more=next<job.account_ids.length;
   await db.DMACheckJob.update(job.id,{results,account_index:next,status:more?'queued':'completed',token:more?crypto.randomUUID():'',note:more?'Refreshing next matched supplier.':'Supplier comparisons refreshed; saved fee evidence is available to concentration calculations.'});
   if(more)return {continuing:true};
  }
 }catch(error){await db.DMACheckJob.update(job.id,{status:'blocked',token:'',note:String(error.message).replace(/https:\/\/\S+/g,'[document link]').slice(0,2000)});}
 await kickDMACheck(base44);return {finished:true};
}