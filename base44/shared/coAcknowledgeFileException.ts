import {requireAdmin,canDataset,get,now,audit,fail} from './coCore.ts';
export async function acknowledgeFileException(b,u,m,input){
 requireAdmin(m);
 if(input.confirm_exclusion!==true)fail('Confirm that this file will be excluded from future backups.');
 if(input.note!==undefined&&(typeof input.note!=='string'||input.note.length>2000))fail('The acknowledgement note must be at most 2000 characters.');
 const E=b.asServiceRole.entities.COFileException,row=await get(E,input.id);
 canDataset(m,row.dataset_id);
 if(row.status==='excluded')return {message:'This file is already acknowledged and excluded.'};
 if(row.status!=='open')fail('This exception is no longer open. Refresh the list.',409);
 const patch={status:'excluded',acknowledged_by:u.id,acknowledged_name:u.full_name||u.email,acknowledged_at:now(),acknowledgement_note:(input.note||'').trim()};
 await E.update(row.id,patch);
 await audit(b,u,'File backup exception acknowledged and excluded',{exception_id:row.id,dataset_id:row.dataset_id,source_id:row.source_id,filename:row.filename,note:patch.acknowledgement_note});
 return {message:'File acknowledged and excluded from future backups. It no longer blocks readiness.'};
}