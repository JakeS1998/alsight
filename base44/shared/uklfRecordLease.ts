export async function withUKLFRecordLease(base44,work) {
 const entity=base44.entities.UKLFRecordSyncState;
 const {records}=await entity.upsert([{key:'primary'}],{key:'key'}),state=records[0],token=crypto.randomUUID();
 const claimed=await entity.updateMany({id:state.id,lease_until:{$lt:new Date().toISOString()}},{$set:{lease_token:token,lease_until:new Date(Date.now()+240000).toISOString()}});
 if(!claimed.updated){const error=new Error('UKLF record creation is already running. Resume shortly.');error.status=409;throw error;}
 const assertLease=async()=>{const row=await entity.get(state.id);if(row.lease_token!==token || Date.parse(row.lease_until)<=Date.now())throw new Error('UKLF creation lease expired. Resume the backfill.');};
 try{return await work(await entity.get(state.id),assertLease);}finally{await entity.updateMany({id:state.id,lease_token:token},{$set:{lease_token:'',lease_until:'1970-01-01T00:00:00.000Z'}});}
}