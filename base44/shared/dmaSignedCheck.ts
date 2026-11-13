import {kickDMACheck} from './dmaCheckQueue.ts';
export async function enqueueSignedDMACheck(base44,dmaId){
 const db=base44.asServiceRole.entities;
 const dma=await db.DMA.get(dmaId).catch(e=>e.status===404?null:Promise.reject(e));
 if(!dma||dma.executed!=='yes')return {skipped:true,reason:'DMA is not signed.'};
 if(!dma.project_id)return {skipped:true,reason:'DMA has no linked project.'};
 const projects=await db.Project.filter({$or:[{id:dma.project_id},{dataverse_id:dma.project_id}]},{limit:2});
 if(projects.items.length!==1)return {skipped:true,reason:'Linked project is missing or ambiguous.'};
 const project=projects.items[0],refs=[project.id,project.dataverse_id].filter(Boolean);
 if(await db.FeeProposal.count({project_id:{$in:refs},is_current:true,status:{$ne:'lost'}}))return {skipped:true,reason:'A current fee proposal is already populated.'};
 const prior=await db.DMACheckJob.filter({dma_id:dma.id},{sort:'-created_date',limit:1});
 const existing=prior.items[0];
 if(existing&&['queued','processing'].includes(existing.status)){await kickDMACheck(base44);return {already_queued:true};}
 const data={dma_id:dma.id,project_id:project.id,reference:dma.document_id,status:'queued',stage:'document',token:'',account_ids:[],account_index:0,results:[],note:'Automatically queued on DMA signing; no current fee proposal exists.',extraction_status:'',claimed_at:''};
 const job=existing?await db.DMACheckJob.update(existing.id,data):await db.DMACheckJob.create(data);
 await kickDMACheck(base44);
 return {queued:true,jobId:job.id};
}