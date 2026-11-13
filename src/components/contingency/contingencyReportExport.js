import {base44} from '@/api/base44Client';
import {downloadPdf} from '@/components/contingency/demoDownloads';
import {stamp,snapshot} from '@/components/contingency/demoData';
export default async function contingencyReportExport(report,format){
 if(!report)throw new Error('This section has no report to download.');
 const generated=stamp(new Date()),scope=report.scope||'Complete fictional demonstration section.',name=`ALS Contingency ${report.title}`.slice(0,140);
 if(format==='pdf'){downloadPdf(`${name.replace(/[^a-zA-Z0-9 _-]/g,'')}.pdf`,report.title,[`Generated ${generated} UK.`,scope,...report.sections.flatMap(section=>[section.title,section.rows.length?`${section.rows.length} records`:'No records',...section.rows.map((row,i)=>`Record ${i+1}\n${section.headers.map((h,j)=>`${h}: ${row[j]??''}`).join('\n')}`)])]);return 1;}
 const fields=[...new Set(report.sections.flatMap(s=>s.headers))],headers=['Report section',...fields];
 if(headers.length>50)throw new Error('This report has too many columns. Download each section separately.');
 const rows=report.sections.flatMap(s=>s.rows.map(row=>[s.title,...fields.map(field=>{const i=s.headers.indexOf(field);return i<0?null:row[i]??null;})]));
 const meta={headers,sheetName:'Contingency report',summary:`FICTIONAL ALS CONTINGENCY PROOF OF CONCEPT. Generated ${generated} UK.`,scope,notes:[`Snapshot ${stamp(snapshot)} UK. No live Microsoft or AWS data.`,...(rows.length?[]:['There are no records in this section.'])]};
 const chunks=[];let current=[];
 for(const row of rows){if(row.some(value=>typeof value==='string'&&value.length>4000))throw new Error('A report field exceeds the spreadsheet limit. Use the PDF download for its complete content.');const candidate=[...current,row];if(candidate.length>1000||JSON.stringify({...meta,rows:candidate}).length>59000){if(!current.length)throw new Error('A report record exceeds the spreadsheet limit. Use PDF for this record.');chunks.push(current);current=[row];}else current=candidate;}
 if(current.length||!chunks.length)chunks.push(current);
 for(let i=0;i<chunks.length;i++){const title=chunks.length>1?`${name} Part ${i+1} of ${chunks.length}`:name;
  const response=await base44.functions.invoke('createAliceDocument',{title,format:'xlsx',content:JSON.stringify({...meta,rows:chunks[i]})});
  const file=response.data?.document;if(!response.data?.success||!file?.file_uri)throw new Error(response.data?.error||'Unable to create the Excel report.');
  const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:file.file_uri,expires_in:300});const download=await fetch(signed_url);if(!download.ok)throw new Error('Unable to download the Excel report.');
  const url=URL.createObjectURL(await download.blob()),link=document.createElement('a');link.href=url;link.download=file.filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 return chunks.length;
}