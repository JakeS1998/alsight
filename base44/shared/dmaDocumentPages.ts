import {PDFDocument} from 'npm:pdf-lib@1.17.1';
import {dmaScannedPages} from './dmaScannedPages.ts';
export async function dmaDocumentPages(base44,url) {
 try {return await dmaScannedPages(base44,url);}catch(error){
  if(!String(error.message).includes('not a single readable JPEG scan'))throw error;
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw new Error('Signed DMA download failed.');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>25000000)throw new Error('Signed DMA exceeds 25 MB.');
  const doc=await PDFDocument.load(bytes);if(doc.getPageCount()>90)throw new Error('Signed DMA exceeds 90 pages.');
  const pages=[];
  for(let start=0;start<doc.getPageCount();start+=16){
   const part=await PDFDocument.create();const indices=Array.from({length:Math.min(16,doc.getPageCount()-start)},(_,n)=>start+n);
   for(const page of await part.copyPages(doc,indices))part.addPage(page);
   const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([await part.save()],`signed-dma-pages-${start+1}.pdf`,{type:'application/pdf'})});
   const {signed_url}=await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({file_uri,expires_in:600});
   pages.push({page:start+1,last_page:start+indices.length,url:signed_url,pdf:true});
  }
  return pages;
 }
}