import {unzipSync,zipSync,strFromU8,strToU8} from 'npm:fflate@0.8.2';
import {XMLParser,XMLBuilder} from 'npm:fast-xml-parser@4.5.3';
// ExcelJS only recognises xl/commentsN.xml and worksheet-relative note links.
// Normalise those links in a temporary copy; retain all cell values and notes.
export function normaliseRiskWorkbookComments(bytes){
 let expanded=0;
 const files=unzipSync(bytes,{filter:entry=>{expanded+=entry.originalSize;if(entry.originalSize>20000000||expanded>50000000)throw new Error('The workbook expands beyond the safe reading limit. Save a smaller copy of the register.');return true;}});
 const parser=new XMLParser({ignoreAttributes:false,parseTagValue:false,parseAttributeValue:false}),builder=new XMLBuilder({ignoreAttributes:false});
 let changed=false,index=10000;
 for(const name of Object.keys(files).filter(name=>/^xl\/worksheets\/_rels\/[^/]+\.xml\.rels$/.test(name))){
  const xml=strFromU8(files[name]);if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('Unsupported declarations in workbook relationships.');
  const tree=parser.parse(xml),relationships=tree.Relationships?.Relationship;
  for(const rel of Array.isArray(relationships)?relationships:relationships?[relationships]:[]){
   const type=String(rel['@_Type']||'');if(!/\/(comments|vmlDrawing)$/.test(type)||rel['@_TargetMode']==='External')continue;
   const target=new URL(String(rel['@_Target']||''),'https://workbook.invalid/xl/worksheets/sheet.xml');
   if(target.origin!=='https://workbook.invalid')throw new Error('Invalid workbook note link.');
   const path=decodeURIComponent(target.pathname).slice(1);
   if(!files[path])throw new Error('The workbook contains a broken cell-note link. Open it in Excel, save a fresh copy, and upload that copy.');
   let normalised=path;
   if(type.endsWith('/comments')&&!/^xl\/comments\d+\.xml$/.test(path)){
    do{normalised=`xl/comments${index++}.xml`;}while(files[normalised]);
    files[normalised]=files[path];
   }
   if(type.endsWith('/vmlDrawing')&&!/^xl\/drawings\/vmlDrawing\d+\.vml$/.test(path)){
    do{normalised=`xl/drawings/vmlDrawing${index++}.vml`;}while(files[normalised]);
    files[normalised]=files[path];
   }
   const relative=normalised.startsWith('xl/')?`../${normalised.slice(3)}`:null;
   if(!relative)throw new Error('Invalid workbook note location.');
   if(rel['@_Target']!==relative){rel['@_Target']=relative;changed=true;}
  }
  files[name]=strToU8(builder.build(tree));
 }
 return changed?zipSync(files,{level:1}):bytes;
}