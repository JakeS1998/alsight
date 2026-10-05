import {normaliseCompanyNumber} from './companiesHouseData.ts';
const keys=['revenue','profit','assets','current_assets','fixed_assets','current_liabilities','net_assets','cash','borrowings'];
const date=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
export function normalisePdfAccounts(output,number,filedAt) {
  let matched=false;try {matched=normaliseCompanyNumber(output?.company_number)===number;}catch {return [];}
  if(!matched || output.currency!=='GBP' || output.entity_basis!=='company' || !Array.isArray(output.periods) || output.periods.length>3) return [];
  const periods=[];
  for(const p of output.periods) {
    if(!date(p.end) || Date.parse(p.end)>Date.parse(filedAt) || p.start && (!date(p.start) || Date.parse(p.start)>=Date.parse(p.end)) || !Array.isArray(p.metrics) || p.metrics.length>9) continue;
    if(output.periods.filter(other=>other.end===p.end).length!==1) continue;
    const days=p.start ? (Date.parse(p.end)-Date.parse(p.start))/86400000+1 : 0,metrics={};
    for(const m of p.metrics) {
      if(!keys.includes(m.key) || p.metrics.filter(other=>other.key===m.key).length!==1 || !Number.isFinite(m.value) || ![1,1000,1000000].includes(m.multiplier) || !Number.isInteger(m.page) || m.page<1 || m.page>300 || typeof m.quote!=='string' || m.quote.trim().length<3 || m.quote.length>500) continue;
      if(['revenue','profit'].includes(m.key) && !p.start) continue;
      const quotedNumbers=(m.quote.match(/\(?[-−]?\d[\d,]*(?:\.\d+)?\)?/g) || []).map(text=>Number(text.replace(/[(),]/g,'').replace('−','-'))*(text.startsWith('(') ? -1 : 1));
      if(!quotedNumbers.some(value=>value===m.value)) continue;
      const quote=m.quote.toLowerCase();
      if(m.key==='borrowings' && (!/total/.test(quote) || !/borrowings|interest.bearing debt/.test(quote))) continue;
      const value=m.value*m.multiplier;if(!Number.isFinite(value) || !['profit','net_assets'].includes(m.key) && value<0) continue;
      metrics[m.key]={value,concept:m.key==='borrowings' ? 'TotalBorrowings' : `PDF:${m.key}`,start:['revenue','profit'].includes(m.key) ? p.start : '',end:p.end,annual:['revenue','profit'].includes(m.key) && days>=365 && days<=366,page:m.page,quote:m.quote.trim(),multiplier:m.multiplier};
    }
    if(Object.keys(metrics).length) periods.push({end:p.end,start:p.start || '',metrics,origin:'pdf',confidence:'Low'});
  }
  return periods;
}