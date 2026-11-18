import {getDocument,OPS} from 'npm:pdfjs-dist@4.8.69/legacy/build/pdf.mjs';
import {WorkerMessageHandler} from 'npm:pdfjs-dist@4.8.69/legacy/build/pdf.worker.mjs';
const paintOps=new Set(Object.entries(OPS).filter(([name])=>/paint|stroke|fill|showText|shading/i.test(name)&&!/^set/i.test(name)&&name!=='paintFormXObjectBegin'&&name!=='paintFormXObjectEnd').map(([,value])=>value));

export async function readProtectedJCTText(bytes) {
 globalThis.pdfjsWorker ??= {WorkerMessageHandler};
 const task=getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:false,disableFontFace:true,stopAtErrors:true,verbosity:0});
 try{
  const pdf=await task.promise;
  if(pdf.numPages>500)throw new Error('The signed JCT exceeds the 500-page reading limit.');
  const pages=[];
  for(let number=1;number<=pdf.numPages;number++){
   const page=await pdf.getPage(number);
   const content=await page.getTextContent();
   const text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
   if(text){pages.push(text);}
   else {
    const operators=await page.getOperatorList();
    if(operators.fnArray.some(op=>paintOps.has(op)))throw new Error(`Page ${number} of this protected PDF has visible content but no readable text. Use Verify terms to review the original signed JCT, or link an authorised text-readable copy and retry extraction.`);
    pages.push('[Blank page]');
   }
   page.cleanup();
  }
  return pages;
 }catch(error){
  if(error.name==='PasswordException')throw new Error('This signed PDF requires a password to open. Use an authorised readable copy in SharePoint, then retry.');
  throw error;
 }finally{await task.destroy();}
}