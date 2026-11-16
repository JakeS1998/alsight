import {kickDMACheck} from './dmaCheckQueue.ts';
export async function recheckAllSignedDMAs(base44) {
 const db=base44.asServiceRole.entities;let cursor,total=0,reused=0,created=0;
 do {
  const page=await db.DMA.filter({executed:'yes'},{sort:'document_id',limit:100,...(cursor?{cursor}:{})});
  const ids=page.items.map(d=>d.id),prior=[];let jobCursor;
  if(ids.length)do{const jobs=await db.DMACheckJob.filter({dma_id:{$in:ids}},{sort:'-created_date',limit:100,...(jobCursor?{cursor:jobCursor}:{})});prior.push(...jobs.items);jobCursor=jobs.has_more?jobs.next_cursor:null;}while(jobCursor);
  const updates=[],additions=[];
  for(const dma of page.items){
   const existing=prior.find(job=>job.dma_id===dma.id&&job.status!=='processing');
   const data={dma_id:dma.id,project_id:dma.project_id||'',reference:dma.document_id,status:'queued',stage:'recheck_document',token:'',account_ids:[],account_index:0,results:[],extraction_status:'',claimed_at:'',note:'Requested full re-read of signed DMA and supplier attribution, including projects with current proposals.'};
   if(existing){updates.push({id:existing.id,...data});reused++;}else {additions.push(data);created++;}
  }
  if(updates.length)await db.DMACheckJob.bulkUpdate(updates);
  if(additions.length)await db.DMACheckJob.bulkCreate(additions);
  total+=page.items.length;cursor=page.has_more?page.next_cursor:null;
 }while(cursor);
 await kickDMACheck(base44);
 return {started:true,total,reused,created,mode:'Full signed DMA re-read; existing commercial source priorities retained.'};
}