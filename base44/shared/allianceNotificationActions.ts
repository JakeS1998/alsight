export async function updateAllianceNotification(base44,user,input) {
  if(typeof input.id!=='string' || !/^[a-f0-9]{24}$/i.test(input.id)) throw new Error('Invalid notification.');
  const db=base44.asServiceRole.entities,row=await db.AllianceNotification.get(input.id);
  if(!row || row.user_id!==user.id) throw new Error('This notification is not available to you.');
  const now=new Date().toISOString();
  await db.AllianceNotification.update(row.id,{read_at:row.read_at || now,...(input.dismiss===true ? {dismissed_at:now} : {})});
  return {updated:true};
}