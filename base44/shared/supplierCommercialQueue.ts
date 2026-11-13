export const supplierCommercialScope={$or:[{account_type:'supplier'},{relationship_types:{$in:['supplier','contractor','consultant']}}]};
export async function kickSupplierCommercialCheck(base44){
 const db=base44.asServiceRole.entities;
 if(await db.SupplierCommercialCheck.count({$or:[{status:'processing'},{status:'queued',token:{$ne:''}}]}))return;
 const page=await db.SupplierCommercialCheck.filter({status:'queued',token:''},{sort:'created_date',limit:1});
 if(page.items[0])await db.SupplierCommercialCheck.update(page.items[0].id,{token:crypto.randomUUID()});
}
export async function startSupplierCommercialChecks(base44){
 const db=base44.asServiceRole.entities;
 if(await db.SupplierCommercialCheck.count({status:{$in:['queued','processing']}})){await kickSupplierCommercialCheck(base44);return {already_running:true};}
 let cursor,total=0;
 do {
  const page=await db.Account.filter(supplierCommercialScope,{limit:100,sort:'created_date',fields:['name'],...(cursor?{cursor}:{})});
  if(page.items.length)await db.SupplierCommercialCheck.bulkCreate(page.items.map(a=>({account_id:a.id,account_name:a.name,status:'queued',stage:'accounts',token:'',note:''})));
  total+=page.items.length;cursor=page.has_more?page.next_cursor:null;
 }while(cursor);
 await kickSupplierCommercialCheck(base44);return {started:true,total};
}