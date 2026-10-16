import mammoth from 'npm:mammoth@1.9.1/mammoth.browser.js';
import {extractText} from 'npm:unpdf@0.12.1';
import {projectSharePointReads} from './projectSharePointReads.ts';
import {pqSharePointItem} from './pqSharePointItem.ts';
import {pqDocumentAnswers} from './pqDocumentAnswers.ts';
export async function pqSourceDocument(base44,project){
 const reads=await projectSharePointReads(base44);let item=await pqSharePointItem(reads,project.link_to_project_questionnaire);
 if(item.folder){
  const candidates=(await reads.children(item)).filter(file=>file.file&&/\.(pdf|docx|doc)$/i.test(file.name)&&/questionnaire|\bPQ\d?\b/i.test(file.name)&&!/^~\$|\b(template|superseded|archive)\b/i.test(file.name));
  if(candidates.length!==1)throw new Error(candidates.length?'Several questionnaires were found. Set the project PQ link to the exact approved document.':'No uniquely named questionnaire was found. Set the project PQ link to its PDF or Word document.');
  item=candidates[0];
 }
 if(!item.file||! /\.(pdf|docx|doc)$/i.test(item.name))throw new Error('The PQ link must point to a PDF or Word questionnaire.');
 const path=`/drives/${encodeURIComponent(item.parentReference.driveId)}/items/${encodeURIComponent(item.id)}`;
 const metadata=await reads.graph(path);
 if(metadata.size>10*1024*1024||!metadata['@microsoft.graph.downloadUrl'])throw new Error('The PQ document must be downloadable and no larger than 10 MB.');
 let response;
 if(/\.doc$/i.test(item.name)){
  const {accessToken}=await base44.asServiceRole.connectors.getConnection('share_point');
  response=await fetch(`https://graph.microsoft.com/v1.0${path}/content?format=pdf`,{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(30000)});
 }else response=await fetch(metadata['@microsoft.graph.downloadUrl'],{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('Unable to download the linked PQ document.');
 const reader=response.body.getReader(),chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>10*1024*1024){await reader.cancel();throw new Error('The PQ document exceeds 10 MB.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const pdf=!/\.docx$/i.test(item.name),extracted=pdf?await extractText(bytes.slice(),{mergePages:true}):null;
 const text=pdf?extracted.text:(await mammoth.extractRawText({arrayBuffer:bytes.buffer})).value;
 if(text.length>60000)throw new Error('The PQ document exceeds the 60,000 character import limit.');
 let visualUrl=null;
 if(pdf){
  const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([bytes],item.name.replace(/\.doc$/i,'.pdf'),{type:'application/pdf'})});
  ({signed_url:visualUrl}=await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({file_uri,expires_in:600}));
 }
 if(pdf&&(!Number.isInteger(extracted.totalPages)||extracted.totalPages<1||extracted.totalPages>40))throw new Error('The PQ PDF must contain between 1 and 40 pages.');
 if(!visualUrl&&!text.trim())throw new Error('The PQ needs readable text or a PDF copy for visual import.');
 const result=await pqDocumentAnswers(base44,text,visualUrl,extracted?.totalPages||0);
 return {...result,name:item.name,url:item.webUrl};
}