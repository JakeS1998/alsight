import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {isGuid,isName} from './dataverseFlowFields.ts';
export async function insuranceCertificateFile(base44,policy) {
 const config=await flowConfig(base44),settings=config?.tables?.insurance;
 const field=settings?.mappings?.find(m=>m.local==='certificate_url')?.source;
 if(!isGuid(policy.dataverse_id)||!isName(field)||!isName(settings?.logicalName)||!isName(settings?.primaryId))throw new Error('This policy has no configured Dataverse certificate file.');
 const context=await sharedFlowContext(base44,config);
 const request=(path,body)=>flowRequest(context.environment,context.token,path,{method:'POST',body:JSON.stringify(body)});
 const info=await request('InitializeFileBlocksDownload',{Target:{'@odata.type':`Microsoft.Dynamics.CRM.${settings.logicalName}`,[settings.primaryId]:policy.dataverse_id},FileAttributeName:field});
 const size=Number(info.FileSizeInBytes),limit=25*1024*1024;
 if(!Number.isSafeInteger(size)||size<=0)throw new Error('No certificate file is attached to this policy in Dataverse.');
 if(size>limit)throw new Error('This certificate exceeds the 25 MB download limit. Open it in Dataverse.');
 const parts=[],chunk=info.IsChunkingSupported===false?size:4*1024*1024;
 let received=0;
 for(let offset=0;offset<size;offset+=chunk){
  const block=await request('DownloadBlock',{FileContinuationToken:info.FileContinuationToken,Offset:offset,BlockLength:Math.min(chunk,size-offset)});
  const binary=atob(block.Data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  received+=bytes.length;if(received>limit)throw new Error('Certificate download exceeded its size limit.');parts.push(bytes);
 }
 if(received!==size)throw new Error('The certificate download was incomplete. Try again.');
 const name=String(info.FileName||'insurance-certificate.pdf').replace(/[\x00-\x1f/\\]/g,'_').slice(0,180);
 const extension=name.split('.').pop().toLowerCase(),mime={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}[extension];
 if(!mime)throw new Error('This certificate format is not supported. Open it in Dataverse.');
 const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File(parts,name,{type:mime})});
 return {file_uri,filename:name};
}