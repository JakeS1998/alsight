import {now,requireAdmin} from './coCore.ts';
export const copyLimitBytes=10*1024*1024;
export function checkCopySize(size){if(size>copyLimitBytes){const e=new Error('This document exceeds the 10 MB continuity copy limit.');e.code='CONTINUITY_FILE_TOO_LARGE';e.fileSize=size;throw e;}}
export async function saveFileExceptions(b,d,flags,checked){
 const ids=[...new Set([...flags.map(x=>x.id),...checked])];if(!ids.length)return;
 const E=b.asServiceRole.entities.COFileException,at=now();
 const existing=(await E.filter({dataset_id:d.id,source_id:{$in:ids}},{limit:150})).items,index=new Map(existing.map(x=>[x.source_id,x])),creates=[],updates=[];
 for(const item of flags){const old=index.get(item.id);if(old?.status==='excluded')continue;const patch={dataset_id:d.id,source_id:item.id,filename:String(item.name).slice(0,500),project_name:d.mapping?.project_name||'',source_label:d.label,file_size:Math.ceil(item.size),limit_bytes:copyLimitBytes,web_url:item.webUrl||'',status:'open',last_detected:at,resolved_at:''};old?updates.push({id:old.id,...patch}):creates.push({...patch,first_detected:at});}
 for(const id of checked){const old=index.get(id);if(old?.status==='open')updates.push({id:old.id,status:'resolved',resolved_at:at});}
 await Promise.all([creates.length?E.bulkCreate(creates):null,updates.length?E.bulkUpdate(updates):null]);
}
export async function readFileExceptions(b,m,input){
 requireAdmin(m);const E=b.asServiceRole.entities,q={status:input.status==='excluded'?'excluded':'open',...(!m.global?{dataset_id:{$in:m.dataset_ids}}:{})};
 const [page,total,c]=await Promise.all([E.COFileException.filter(q,{sort:'-created_date',limit:50,...(typeof input.cursor==='string'&&input.cursor.length<3000?{cursor:input.cursor}:{})}),E.COFileException.count(q),E.COConfig.filter({key:'primary'},{limit:1})]);
 return{...page,total,discovery_in_progress:!!c.items[0]?.policy?.project_legals?.scan_in_progress};
}