export async function resolveInsuranceReferences(base44, table, values) {
 if(table!=='insurance')return values.map(value=>({value,error:''}));
 const ids=[...new Set(values.map(v=>v?.account_id?.toLowerCase()).filter(Boolean))];
 const accounts=ids.length ? (await base44.entities.Account.filter({dataverse_id:{$in:ids}},{limit:100,fields:['dataverse_id','linked_user_id']})).items : [];
 return values.map(value=>{
  if(!value)return {value,error:''};
  const matches=accounts.filter(a=>a.dataverse_id?.toLowerCase()===value.account_id?.toLowerCase());
  return {value:{...value,account_id:value.account_id?.toLowerCase() || '',linked_user_id:matches[0]?.linked_user_id || ''},error:matches.length===1 ? '' : 'The policy supplier lookup must match exactly one synced account. Sync accounts first and review this policy again.'};
 });
}
export async function refreshInsuranceAccountAccess(base44, updates) {
 for(const account of updates){
  if(!account.dataverse_id)continue;
  let cursor;
  do {
   const page=await base44.entities.SupplierInsurance.filter({account_id:account.dataverse_id.toLowerCase()},{limit:100,cursor,fields:['linked_user_id']});
   const changes=page.items.filter(p=>(p.linked_user_id || '')!==(account.linked_user_id || '')).map(p=>({id:p.id,linked_user_id:account.linked_user_id || ''}));
   if(changes.length)await base44.entities.SupplierInsurance.bulkUpdate(changes);
   cursor=page.has_more ? page.next_cursor : undefined;
  }while(cursor);
 }
}