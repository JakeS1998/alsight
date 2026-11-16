import {dmaSignedSource} from './dmaSignedSource.ts';
export async function checkDMASignedWordRules() {
 const run=async (duplicate=false,missing=false)=>{
  const folder=(id,name,parent)=>({id,name,folder:{},parentReference:{driveId:'fixture-drive',id:parent}});
  const items={
   dmaWip:folder('dmaWip','1.07. DMA','wip'),wip:folder('wip','Legals Work in Progress','legals'),
   legals:folder('legals','2. Legals','admin'),signed:folder('signed','Legals Signed','legals'),dmaSigned:folder('dmaSigned','1.07. DMA','signed')
  };
  const pdf={id:'signed-pdf',name:'Development Management Agreement signed.pdf',file:{},webUrl:'https://allianceleisureservice.sharepoint.com/sites/Client_Projects/Legals%20Signed/1.07.%20DMA/signed.pdf',parentReference:{driveId:'fixture-drive',id:'dmaSigned'}};
  const reads={
   resolve:async()=>({id:'word',name:'Agreement.docx',file:{},webUrl:'https://allianceleisureservice.sharepoint.com/sites/Client_Projects/_layouts/15/Doc.aspx',parentReference:{driveId:'fixture-drive',id:'dmaWip'}}),
   graph:async path=>{const id=path.match(/\/items\/([^/?]+)/)?.[1];return id===pdf.id?pdf:items[id];},
   children:async item=>item.id==='legals'?missing?[]:[items.signed]:item.id==='signed'?[items.dmaSigned,folder('consultants','Project Manager','signed')]:item.id==='dmaSigned'?duplicate?[pdf,{...pdf,id:'other-pdf'}]:[pdf]:[]
  };
  try {return {file:await dmaSignedSource(reads,{}, {link_to_file:'https://allianceleisureservice.sharepoint.com/sites/Client_Projects/_layouts/15/Doc.aspx?source=fixture'})};}
  catch(error){return {error:String(error.message)};}
 };
 const [valid,ambiguous,missing]=await Promise.all([run(),run(true),run(false,true)]);
 return {wordLinkTracesLegalsSigned:valid.file?.id==='signed-pdf',wordDraftNeverUsed:valid.file?.name.endsWith('.pdf')===true,wordMultipleSignedDMAsBlocked:ambiguous.error?.includes('Multiple signed DMA PDFs')===true,wordMissingSignedFolderBlocked:missing.error?.includes('no unique Legals Signed folder')===true};
}