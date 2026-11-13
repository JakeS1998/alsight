import {base44} from '@/api/base44Client';
export default async function downloadContingencyFile(file){
 const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:file.file_uri,expires_in:60});
 const response=await fetch(signed_url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('The private file could not be downloaded. Please try again.');
 const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');
 link.href=url;link.download=(file.filename||'document').replace(/[\\/\x00-\x1f]/g,'_');document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}