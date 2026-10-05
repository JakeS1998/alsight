import { unzipSync,strFromU8 } from 'npm:fflate@0.8.2';
import { sourceFetch,sourceText } from './aseSourceCommon.ts';
export async function councilReturn(url,code,mode='outturn') {
  if(new URL(url).hostname!=='assets.publishing.service.gov.uk' || !/\.ods$/i.test(new URL(url).pathname)) throw new Error('Expected an official MHCLG ODS return.');
  const response=await sourceFetch(url,{},3000000); if(!response.ok) throw new Error('MHCLG return download is unavailable.');
  const files=unzipSync(response.bytes,{filter:file=>file.name==='content.xml' && file.originalSize<16000000});
  if(!files['content.xml']) throw new Error('ODS return exceeds the safe parsing limit or lacks data.');
  const xml=strFromU8(files['content.xml']);
  const cells=row=>{const values=[];for(const match of row.matchAll(/<table:table-cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)){const repeat=Math.min(300,Number(match[1].match(/table:number-columns-repeated="(\d+)"/)?.[1] || 1));const numeric=match[1].match(/office:value="([^"]+)"/);const value=numeric && Number.isFinite(Number(numeric[1])) ? Number(numeric[1]) : sourceText(match[2] || '');for(let n=0;n<repeat && values.length<300;n++) values.push(value);if(values.length>=300) break;}return values;};
  for(const table of xml.matchAll(/<table:table\s[^>]*table:name="([^"]+)"[\s\S]*?<\/table:table>/g)) {
    if(!(mode==='budget' ? /^RA_LA_Data/i : /^RS_LA_Data/i).test(table[1])) continue;
    const rows=[...table[0].matchAll(/<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g)];
    const headerRow=rows.find(row=>row[1].includes('ONS Code')),authority=rows.find(row=>row[1].includes(code));
    if(!headerRow || !authority) continue;
    const headers=cells(headerRow[1]),values=cells(authority[1]),codeIndex=headers.indexOf('ONS Code');
    if(values[codeIndex]!==code) throw new Error('ONS authority-code match failed.');
    const name=values[headers.indexOf('Local authority')];
    const facts=headers.map((header,index)=>({header,value:values[index]})).filter(row=>typeof row.value==='number' && (/NET REVENUE EXPENDITURE|Capital financing|unallocated financial reserves level at 31 March|other earmarked financial reserves level at 31 March|budget stabilisation at 31 March|TOTAL SERVICE EXPENDITURE/i.test(row.header))).slice(0,mode==='budget' ? 3 : 8);
    const certification=values[headers.indexOf('Certification')];
    if(!facts.length) throw new Error('This authority has no reported numeric financial figures in the selected return.');
    return {code,name,certification,facts,sheet:table[1]};
  }
  throw new Error('No exact ONS authority-code row found in this year’s return. Check reorganisations and the saved authority code.');
}