const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
export function psoDate(value) {
 const text=String(value||'').replace(/^(?:date\s*:?\s*)/i,'').trim();
 let match=text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/),day,month,year;
 if(match){day=+match[1];month=+match[2];year=+match[3];}
 else {match=text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})\b/i);if(match){day=+match[1];month=months.findIndex(m=>m.startsWith(match[2].toLowerCase()))+1;year=+match[3];}else {match=text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);if(!match)return null;year=+match[1];month=+match[2];day=+match[3];}}
 const date=new Date(Date.UTC(year,month-1,day));
 return month && date.getUTCFullYear()===year && date.getUTCMonth()===month-1 && date.getUTCDate()===day ? date.toISOString().slice(0,10) : null;
}
export function mapPsoApprovals(rows) {
 const updates={},warnings=[];
 const sectionRules=[['pq',/^PQ\s+APPROVED\s*:/i],['aa',/^AA\s+(?:RIBA\s*[1-7](?:\s*[-–]\s*[1-7])?\s+)?APPROVED\s*:/i],['aa_variations',/^AA\s+VARIATIONS?\s+APPROVED/i]];
 for(const [key,pattern] of sectionRules) {
  const matching=rows.filter(row=>row.some(cell=>pattern.test(String(cell).trim())));
  if(matching.length!==1){warnings.push(`${key.toUpperCase()}: ${matching.length?'multiple':'no'} named approval sections found.`);continue;}
  const row=matching[0],approverIndex=row.findIndex(cell=>/^APPROVED\s+BY\s*:/i.test(String(cell).trim()));
  if(approverIndex<0){warnings.push(`${key.toUpperCase()}: named approver label not found.`);continue;}
  const label=String(row[approverIndex]),name=label.replace(/^APPROVED\s+BY\s*:\s*/i,'').trim() || String(row[approverIndex+1]||'').trim();
  if(name)updates[`pso_${key}_approved_by`]=name;
  const dates=[...new Set(row.slice(approverIndex+1).map(psoDate).filter(Boolean))];
  if(dates.length===1)updates[`pso_${key}_date`]=dates[0];
  else warnings.push(`${key.toUpperCase()}: ${dates.length?'conflicting':'no'} approval date; not imported.`);
 }
 const headerIndex=rows.slice(0,14).findIndex(row=>row.some(cell=>/^FINAL\s+(?:APPROVAL|SIGN\s*[- ]?OFF)\s+BY\s*:?/i.test(String(cell).trim())));
 if(headerIndex>=0) {
  const header=rows[headerIndex],nameColumn=header.findIndex(cell=>/^FINAL\s+(?:APPROVAL|SIGN\s*[- ]?OFF)\s+BY/i.test(String(cell).trim())),dateColumn=header.findIndex((cell,i)=>i>nameColumn && /^DATE\s*:?\s*$/i.test(String(cell).trim()));
  const values=rows[headerIndex+1]||[],name=String(values[nameColumn]||'').trim(),date=dateColumn>=0?psoDate(values[dateColumn]):null;
  if(name)updates.pso_dma_approved_by=name;
  if(date)updates.pso_dma_date=date;
  if(!name || !date)warnings.push('DMA: top final sign-off is incomplete; blank fields were not imported.');
 } else warnings.push('DMA: top final sign-off label not found.');
 return {updates,warnings};
}
export async function readPsoApprovals(reads,link) {
 const item=await reads.resolve(link);
 if(!/\.xlsx$/i.test(item.name))throw new Error('The PSO link must point to an Excel workbook.');
 const base=`/drives/${item.parentReference.driveId}/items/${item.id}/workbook`,sheets=await reads.graph(`${base}/worksheets?$select=id,name`);
 const candidates=[];
 for(const sheet of sheets.value.slice(0,6)) {
  const range=await reads.graph(`${base}/worksheets/${encodeURIComponent(sheet.id)}/range(address='A1:L80')?$select=text`);
  if(range.text.some(row=>row.some(cell=>/PROJECT\s+APPROVAL\s+REPORT/i.test(String(cell)))))candidates.push({sheet:sheet.name,...mapPsoApprovals(range.text)});
 }
 if(candidates.length!==1)throw new Error(candidates.length?'Multiple PSO approval sheets found; review the workbook.':'No recognised PSO approval report found.');
 return {file:item.name,url:item.webUrl,...candidates[0]};
}