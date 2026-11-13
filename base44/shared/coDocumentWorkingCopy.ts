import {fail,cas,audit,now} from './coCore.ts';
export async function currentWorkingCopy(b,incidentId,recordId){
 if(!incidentId)return null;
 const page=await b.asServiceRole.entities.COChange.filter({incident_id:incidentId,record_id:recordId,operation:'document_replace',status:{$ne:'excluded'}},{sort:'-created_date',limit:1});
 return page.items[0]||null;
}
export function workingCopySummary(change){return change?{id:change.id,status:change.status,filename:change.details.filename,uploaded_filename:change.details.uploaded_filename,sha256:change.details.sha256,file_size:change.details.file_size,author_name:change.details.author_name,at:change.details.at}:null;}
export async function replacementWorkingCopy(b,i,r,input){
 if(!r.file_uri||!r.source_etag||r.deleted_at_source)fail('A backed-up file with an existing SharePoint version is required for replacement.',409);
 const latest=await currentWorkingCopy(b,i.id,r.id);
 if((input.working_change_id||'')!==(latest?.id||''))fail('Another edited copy was uploaded. Download the latest working copy and review your edits before uploading again.',409);
 if(latest?.status==='writing')fail('This file is being restored. Editing is frozen.',409);
 const extension=name=>String(name||'').match(/\.[^.]+$/)?.[0]?.toLowerCase()||'';
 if(!input.filename||extension(input.filename)!==extension(r.title))fail('Upload the same file type as the original document; its SharePoint name and location will be preserved.');
 return latest;
}
export async function supersedeWorkingCopy(b,u,i,previous,saved){
 if(!previous||previous.status==='verified')return;
 await cas(b.asServiceRole.entities.COChange,previous,{version:previous.version},{status:'excluded',details:{...previous.details,superseded_by:saved.id,excluded_by:u.id,excluded_at:now(),disposition:'Superseded by a newer contingency working copy. The replacement requires a new independent approval.'}});
 await audit(b,u,'Working document version superseded',{previous_change_id:previous.id,replacement_change_id:saved.id},i.id,saved.transaction_key);
}