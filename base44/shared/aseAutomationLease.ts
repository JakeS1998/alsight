export async function withASEAutomationLease(base44,work,key='global') {
  const db=base44.entities;
  const {records}=await db.ASEAutomationLease.upsert([{key}],{key:'key'}),lock=records[0],token=crypto.randomUUID();
  const claimed=await db.ASEAutomationLease.updateMany({id:lock.id,lease_until:{$lt:new Date().toISOString()}},{$set:{lease_token:token,lease_until:new Date(Date.now()+600000).toISOString()}});
  if(!claimed.updated) return {busy:true,continue:true,waitFor:'PT30S'};
  const assertLease=async()=>{const current=await db.ASEAutomationLease.get(lock.id);if(current.lease_token!==token || Date.parse(current.lease_until)<=Date.now()) throw new Error('Automation lease expired; resume from saved progress.');};
  try{return await work(assertLease);}finally{await db.ASEAutomationLease.updateMany({id:lock.id,lease_token:token},{$set:{lease_until:'1970-01-01T00:00:00.000Z',lease_token:''}});}
}