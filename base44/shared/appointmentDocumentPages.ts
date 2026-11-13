import {dmaDocumentPages} from './dmaDocumentPages.ts';
export async function appointmentDocumentPages(base44,url){
 try{return await dmaDocumentPages(base44,url);}catch(error){
  if(!String(error.message).includes('encrypted'))throw error;
  // Preserve the original signed file; do not bypass PDF encryption or alter signatures.
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw new Error('Signed appointment download failed.');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>8000000)throw new Error('Original protected PDF exceeds the 8 MB reading limit.');
  const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([bytes],'signed-appointment.pdf',{type:'application/pdf'})});
  const {signed_url}=await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({file_uri,expires_in:600});
  return [{page:1,last_page:90,url:signed_url,pdf:true}];
 }
}