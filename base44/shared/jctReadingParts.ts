import {PDFDocument} from 'npm:pdf-lib@1.17.1';

export const jctAttachmentLimit = 8_000_000;
const maxPagesPerPart = 50;
const maxParts = 24;

export async function jctReadingParts(original) {
 const parts=[];
 async function split(start,end) {
  if(parts.length>=maxParts)throw new Error('The signed JCT requires too many reading sections. No amount was inferred.');
  if(end-start<=maxPagesPerPart){
   const part=await PDFDocument.create();
   const pages=await part.copyPages(original,Array.from({length:end-start},(_,index)=>start+index));
   for(const page of pages)part.addPage(page);
   const bytes=await part.save();
   if(bytes.byteLength<=jctAttachmentLimit){parts.push({start,end,bytes});return;}
   if(end-start===1)throw new Error(`PDF page ${start+1} is too large to read on its own. No amount was inferred.`);
  }
  const middle=start+Math.floor((end-start)/2);
  await split(start,middle);
  await split(middle,end);
 }
 if(!original)throw new Error('This protected PDF is too large to read as a single attachment and cannot be split. No amount was inferred.');
 if(!original.getPageCount())throw new Error('The signed JCT contains no readable pages.');
 await split(0,original.getPageCount());
 return parts;
}