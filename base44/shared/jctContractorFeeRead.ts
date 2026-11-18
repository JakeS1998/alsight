import {PDFDocument} from 'npm:pdf-lib@1.17.1';
import {projectSharePointReads} from './projectSharePointReads.ts';
import {dmaSignedFolderFromWord} from './dmaSignedFolderFromWord.ts';
import {jctLinkItem} from './jctLinkItem.ts';
import {jctAttachmentLimit} from './jctReadingParts.ts';
import {readWholeJCT,readLargeJCT,readLargeJCTText} from './jctContractSumAnalysis.ts';
export async function readJCTContractorFee(base44,contract) {
 const reads=await projectSharePointReads(base44),linked=await jctLinkItem(reads,contract.link_to_file);
 let source=linked;
 // An executed JCT's saved PDF link identifies the document, regardless of its folder name.
 // Only folder or non-PDF links need discovery of a unique signed PDF.
 if(!linked.file || !/\.pdf$/i.test(linked.name)){
  const signed=await dmaSignedFolderFromWord(reads,linked);
  const folders=(await reads.children(signed)).filter(row=>row.folder&&/jct|building contract/i.test(row.name));
  if(folders.length!==1)throw new Error('No unique signed JCT folder was found.');
  const files=(await reads.children(folders[0])).filter(row=>row.file&&/\.pdf$/i.test(row.name));
  if(files.length!==1)throw new Error('The signed JCT folder contains multiple or no PDFs; no amount was inferred.');
  source=files[0];
 }
 const file=await reads.graph(`/drives/${source.parentReference.driveId}/items/${source.id}`);
 if(!file['@microsoft.graph.downloadUrl'] || file.size>30000000)throw new Error('Signed JCT is unavailable or exceeds the 30 MB reading limit.');
 const response=await fetch(file['@microsoft.graph.downloadUrl'],{signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error('Signed JCT download failed.');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>30000000)throw new Error('Signed JCT exceeds the 30 MB reading limit.');
 let original=null, protectedPages=null;
 const splitReading=bytes.byteLength>jctAttachmentLimit;
 try {original=await PDFDocument.load(bytes);}catch(error){
  if(!String(error.message).includes('encrypted'))throw error;
  if(splitReading){
   const {readProtectedJCTText}=await import('./jctProtectedText.ts');
   protectedPages=await readProtectedJCTText(bytes);
  }
 }
 const totalPages=protectedPages?.length??original?.getPageCount()??null,pageLimit=totalPages??500;
 const core=base44.asServiceRole.integrations.Core;
 const result=protectedPages ? await readLargeJCTText(core,protectedPages) : splitReading ? await readLargeJCT(core,original) : await readWholeJCT(core,bytes);
 const amount=/^\d+(?:\.\d{1,2})?$/.test(result.amount)?Number(result.amount):null;
 const usable=amount>0&&amount<=1e12&&result.currency==='GBP'&&Number.isInteger(result.page)&&result.page>=1&&result.page<=pageLimit&&!!result.quote;
 return {status:usable?'extracted':'unusable',contract_id:contract.id,reference:contract.document_id,source_name:file.name,source_url:file.webUrl,source_etag:file.eTag,pages_read:totalPages===null?null:pageLimit,reading_scope:splitReading?'Complete original PDF read in sections, including amendments and appendices':totalPages===null?'Complete original protected PDF':'Complete original PDF, including amendments and appendices',total_pages:totalPages,...result,amount:usable?amount:null,saved:false};
}