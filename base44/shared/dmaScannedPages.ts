import {PDFDocument,PDFName,PDFDict,PDFRawStream} from 'npm:pdf-lib@1.17.1';
export async function dmaScannedPages(base44,url) {
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error('The signed DMA could not be downloaded.');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>25000000)throw new Error('Signed DMA exceeds the 25 MB pilot limit.');
 const doc=await PDFDocument.load(bytes,{ignoreEncryption:false}),pages=doc.getPages();
 if(pages.length>90)throw new Error('Signed DMA exceeds the 90-page pilot limit.');
 const selected=[];
 for(let index=0;index<pages.length;index++) {
  const resources=pages[index].node.Resources(),objects=resources?.lookupMaybe(PDFName.of('XObject'),PDFDict);
  const images=(objects?.entries()||[]).map(([,reference])=>doc.context.lookup(reference)).filter(stream=>stream instanceof PDFRawStream && stream.dict.get(PDFName.of('Subtype'))?.toString()==='/Image' && stream.dict.get(PDFName.of('Filter'))?.toString().includes('DCTDecode'));
  const image=images.sort((a,b)=>b.contents.length-a.contents.length)[0];
  if(!image || images.filter(i=>i.contents.length>image.contents.length/2).length!==1)throw new Error(`PDF page ${index+1} is not a single readable JPEG scan; no fee inference was made.`);
  selected.push({page:index+1,bytes:image.contents});
 }
 const sources=[];
 for(let start=0;start<selected.length;start+=4) {
  sources.push(...await Promise.all(selected.slice(start,start+4).map(async page=>{
   const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([page.bytes],`vigo-signed-dma-page-${page.page}.jpg`,{type:'image/jpeg'})});
   const {signed_url}=await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({file_uri,expires_in:600});
   return {page:page.page,url:signed_url};
  })));
 }
 return sources;
}