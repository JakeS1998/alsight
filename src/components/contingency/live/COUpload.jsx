import React,{useState} from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function COUpload({dataset,record,workingCopy,run,busy}){
 const [file,setFile]=useState(null),[reason,setReason]=useState(''),[uploading,setUploading]=useState(false),[error,setError]=useState('');
 const supported='.pdf,.txt,.html,.csv,.xls,.xlsx,.json,.doc,.docx,.rtf,.ppt,.pptx,.odt,.ods,.odp,.png,.jpg,.jpeg,.gif,.webp,.tif,.tiff';
 const extension=name=>name?.match(/\.[^.]+$/)?.[0]?.toLowerCase()||'';
 async function submit(e){
  e.preventDefault();const form=e.currentTarget;setError('');
  if(!file||file.size>10*1024*1024){setError('Choose a file up to 10 MB.');return;}
  if(record?extension(file.name)!==extension(record.title):!supported.split(',').includes(extension(file.name))){setError(record?'Upload the same file type as the original document.':'Choose an Office document, PDF, text, spreadsheet or supported image.');return;}
  setUploading(true);
  try{
   const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
   const result=await run('change_save',{operation:record?'document_replace':'document_new',dataset_id:dataset,record_id:record?.id,working_change_id:workingCopy?.id||'',file_uri,filename:file.name,reason});
   if(result){setFile(null);setReason('');form.reset();}else setError('The file was not recorded. Review the workspace error before retrying.');
  }catch(err){setError(err.message);}finally{setUploading(false);}
 }
 return <form className="cc-panel mt-5 space-y-3" onSubmit={submit}>
  <h3 className="font-semibold">{record?'Upload your edited file':'Submit a new emergency document'}</h3>
  <p className="text-sm text-muted-foreground">{record?`Download the latest copy, edit and save it on your computer, then upload it here. On approved return to normal, it replaces ${record.title} in the original SharePoint folder without changing its name.`:'New files are stored privately and get a unique transaction-prefixed filename on approved recovery.'}</p>
  <p className="text-xs text-muted-foreground">Maximum 10 MB. Nothing is written to SharePoint during the outage; independent approval and version checks are required.</p>
  {workingCopy&&<p className="text-xs text-muted-foreground">Uploading again supersedes the previous working copy and requires a new independent approval. Other users’ concurrent uploads are checked before saving.</p>}
  <input type="file" aria-label={record?'Edited replacement file':'New emergency file'} required disabled={busy||uploading} accept={record?extension(record.title)||undefined:supported} onChange={e=>setFile(e.target.files?.[0]||null)}/>
  <textarea className="cc-field" placeholder="Reason and recovery context" required minLength={10} maxLength={2000} disabled={busy||uploading} value={reason} onChange={e=>setReason(e.target.value)}/>
  <Button type="submit" disabled={busy||uploading||!file}>{uploading?'Saving private working copy…':record?'Save edited working copy':'Submit private document for review'}</Button>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
 </form>;
}