import {now,fail} from './coCore.ts';
import {graphClient,drivePath,content,formats} from './coMicrosoft.ts';
import {copyLimitBytes,saveFileExceptions} from './coFileExceptions.ts';
import {storeSnapshots} from './coSnapshotStore.ts';
import {shouldCopyFile} from './coNightlyEligibility.ts';
export async function documentsBatch(b,d){
 const graph=await graphClient(b),s=d.state||{},checkpoint=s.cycle_start||now(),watermark=s.watermark||s.last_success;
 const queue=[...(s.cycle_start?(s.queue||[]):[d.root_id])];
 const path=s.cursor||`${drivePath(d,queue.shift())}/children?$top=100`;
 let pending=[...(s.pending||[])],next=s.next||'';
 if(!pending.length){const data=await graph(path);pending=(data.value||[]).map(x=>({id:x.id,name:x.name,file:x.file,folder:x.folder,size:x.size,eTag:x.eTag,webUrl:x.webUrl,parentReference:x.parentReference,lastModifiedDateTime:x.lastModifiedDateTime}));next=data['@odata.nextLink']||'';}
 const old=pending.length?(await b.asServiceRole.entities.CORecord.filter({dataset_id:d.id,source_id:{$in:pending.map(x=>x.id)}},{limit:150})).items:[];
 const index=new Map(old.map(r=>[r.source_id,r])),rows=[],versions=[],left=[],flags=[],checked=[];
 for(const item of pending){
  const prior=index.get(item.id),payload={webUrl:item.webUrl,parent_id:item.parentReference?.id,...(d.mapping?.auto_project_legals?{project_id:d.mapping.project_id,project_name:d.mapping.project_name,folder_url:d.mapping.folder_url}:{})};
  if(item.folder){
   queue.push(item.id);
   if(!prior)rows.push({dataset_id:d.id,source_id:item.id,title:item.name,payload:{...payload,kind:'folder'},source_etag:item.eTag||'',source_modified:item.lastModifiedDateTime||'',replicated_at:now(),deleted_at_source:false});
   continue;
  }
  if(!item.file)continue;
  if(!shouldCopyFile(item,prior,watermark)){checked.push(item.id);continue;}
  if(item.size>copyLimitBytes){flags.push(item);continue;}
  if(versions.length>=2){left.push(item);continue;}
  if(!d.mapping?.auto_project_legals&&!formats.test(item.name))fail(`Unsupported file: ${item.name}.`);
  let downloaded;
  try{downloaded=await content(b,d,item.id);}catch(e){if(e.code!=='CONTINUITY_FILE_TOO_LARGE')throw e;flags.push({...item,size:e.fileSize});continue;}
  const {bytes,hash,meta}=downloaded;checked.push(item.id);
  const {file_uri}=await b.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([bytes],item.name,{type:item.file.mimeType||'application/octet-stream'})});
  rows.push({dataset_id:d.id,source_id:item.id,title:item.name,payload:{...payload,kind:'file'},source_etag:meta.eTag,source_modified:meta.lastModifiedDateTime||'',replicated_at:now(),file_uri,sha256:hash,file_size:bytes.byteLength,mime_type:item.file.mimeType||'',deleted_at_source:false});
  versions.push({dataset_id:d.id,source_id:item.id,title:item.name,source_etag:meta.eTag,file_uri,sha256:hash,file_size:bytes.byteLength,copied_at:now()});
 }
 if(queue.length>500)fail('Folder tree exceeds 500 folders; narrow the approved source.');
 await storeSnapshots(b,d,rows);
 if(versions.length)await b.asServiceRole.entities.COVersion.bulkCreate(versions);
 await saveFileExceptions(b,d,flags,checked);
 const cursor=left.length?path:next||'',complete=!left.length&&!cursor&&!queue.length;
 return {...s,pending:left,queue:complete?[]:queue,cursor,next:left.length?next:'',last_success:complete?now():s.last_success,watermark:complete?checkpoint:s.watermark,processed:(s.processed||0)+rows.length,last_batch:rows.length,error:'',failures:0,retry_after:'',cycle_start:complete?'':checkpoint};
}