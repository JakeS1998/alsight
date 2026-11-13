export async function kickDMACheck(base44){
 const db=base44.asServiceRole.entities;
 const active=await db.DMACheckJob.count({$or:[{status:'processing'},{status:'queued',token:{$ne:''}}]});
 if(active)return;
 const page=await db.DMACheckJob.filter({status:'queued',token:''},{sort:'created_date',limit:1});
 if(page.items[0])await db.DMACheckJob.update(page.items[0].id,{token:crypto.randomUUID()});
}
export async function startDMACheck(base44){
 const db=base44.asServiceRole.entities;
 if(await db.DMACheckJob.count({status:{$in:['queued','processing']}})){await kickDMACheck(base44);return {already_running:true,total:await db.DMACheckJob.count({})};}
 let cursor,total=0;
 do {
  const page=await db.DMA.filter({executed:'yes'},{limit:100,sort:'-date_of_execution',...(cursor?{cursor}:{})});
  if(page.items.length)await db.DMACheckJob.bulkCreate(page.items.map(d=>({dma_id:d.id,project_id:d.project_id || '',reference:d.document_id,status:'queued',stage:'document',token:'',account_ids:[],account_index:0,results:[]})));
  total+=page.items.length;cursor=page.has_more?page.next_cursor:null;
 }while(cursor);
 await kickDMACheck(base44);return {started:true,total};
}