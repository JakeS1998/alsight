import {fail} from './coCore.ts';
export async function storeSnapshots(b,d,rows){
 if(!rows.length)return;
 const E=b.asServiceRole.entities.CORecord;
 const existing=(await E.filter({dataset_id:d.id,source_id:{$in:rows.map(r=>r.source_id)}},{limit:150})).items;
 const index=new Map(existing.map(r=>[r.source_id,r]));
 if(index.size!==existing.length)fail('Duplicate snapshot identities require review.',409);
 const updates=[],creates=[];
 for(const r of rows){if(JSON.stringify(r.payload).length>60000)fail('A source record exceeds the supported snapshot size.');const old=index.get(r.source_id);old?updates.push({id:old.id,...r}):creates.push(r);}
 await Promise.all([creates.length?E.bulkCreate(creates):null,updates.length?E.bulkUpdate(updates):null]);
}