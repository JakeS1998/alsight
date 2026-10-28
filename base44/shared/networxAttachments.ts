import { isGuid } from './dataverseFlowFields.ts';
const types={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',txt:'text/plain',csv:'text/csv',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
export function validateNetworxAttachments(files) {
 if(files==null)return null;
 if(!Array.isArray(files) || files.length>5)return 'Attach up to five files.';
 let total=0;const ids=new Set();
 for(const file of files) {
  if(!file || !isGuid(file.id) || ids.has(file.id) || typeof file.filename!=='string' || !file.filename.trim() || file.filename.length>200 || /[\x00-\x1f/\\]/.test(file.filename))return 'Invalid attachment details.';
  ids.add(file.id);const extension=file.filename.split('.').at(-1).toLowerCase();
  if(!types[extension])return 'Attach PDF, Office documents, images, text or CSV files.';
  if(typeof file.body!=='string' || !file.body.length || file.body.length>6990508 || file.body.length%4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.body))return 'Invalid attachment content.';
  const bytes=atob(file.body),size=bytes.length;total+=size;
  if(!size || size>5*1024*1024 || total>10*1024*1024)return 'Attachments must be at most 5 MB each and 10 MB in total.';
  const valid=extension==='pdf' ? bytes.startsWith('%PDF-') : ['docx','xlsx','pptx'].includes(extension) ? bytes.startsWith('PK\x03\x04') : extension==='png' ? bytes.startsWith('\x89PNG\r\n\x1a\n') : ['jpg','jpeg'].includes(extension) ? bytes.startsWith('\xff\xd8\xff') : extension==='gif' ? /^GIF8[79]a/.test(bytes) : extension==='webp' ? bytes.startsWith('RIFF') && bytes.slice(8,12)==='WEBP' : !bytes.includes('\x00');
  if(!valid)return 'An attachment does not match its file type.';
 }
 return null;
}
export function networxAttachmentRecords(files=[]) {
 return files.map(file=>({activitymimeattachmentid:file.id,filename:file.filename,mimetype:types[file.filename.split('.').at(-1).toLowerCase()],body:file.body,objecttypecode:'email'}));
}
export function sameNetworxAttachments(actual=[],expected=[]) {
 return actual.length===expected.length && expected.every(file=>actual.some(row=>row.activitymimeattachmentid?.toLowerCase()===file.activitymimeattachmentid.toLowerCase() && row.filename===file.filename && row.mimetype===file.mimetype && row.body===file.body));
}