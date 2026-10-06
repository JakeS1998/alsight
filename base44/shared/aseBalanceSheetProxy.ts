export function accountsTurnoverExemption(content='') {
  const text=String(content).replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ');
  const match=text.match(/(?:elected|chosen|decided) not to (?:include|file|deliver)[^.]{0,180}profit and loss account|profit and loss account[^.]{0,140}(?:not (?:been )?(?:filed|included)|omitted)|(?:prepared|accounts)[^.]{0,160}(?:micro.entity (?:provisions|regime)|provisions applicable to micro.entities)/i);
  return match ? {confirmed:true,quote:match[0].slice(0,400)} : null;
}
export function balanceSheetProxy(period,number,now=new Date(),maxAgeDays=913) {
  const unavailable={status:'unavailable',reason:'An exemption-confirmed, recent company-only GBP balance-sheet total is required.'};
  if(!period?.filing_exemption?.confirmed || !accountsTurnoverExemption(period.filing_exemption.quote)) return unavailable;
  let source;try {source=new URL(period.source_url);}catch {return unavailable;}
  const age=(now.getTime()-Date.parse(period.end))/86400000,filed=Date.parse(period.filed_at);
  if(!Number.isFinite(age) || age<0 || age>maxAgeDays || !Number.isFinite(filed) || filed<Date.parse(period.end) || filed>now.getTime() || source.protocol!=='https:' || source.hostname!=='find-and-update.company-information.service.gov.uk' || !source.pathname.startsWith(`/company/${number}/filing-history/`)) return unavailable;
  const metrics=period.metrics || {},valid=metric=>metric && Number.isFinite(metric.value) && metric.value>=0 && metric.end===period.end && !metric.start;
  const pdf=period.origin==='pdf',cited=metric=>!pdf || period.pdf_file_uri && Number.isInteger(metric.page) && metric.page>0 && metric.quote;
  let value,derivation,citations;
  if(valid(metrics.assets) && cited(metrics.assets) && (!pdf || /\btotal assets\b|\bbalance sheet total\b/i.test(metrics.assets.quote))) {value=metrics.assets.value;derivation='Disclosed total assets';citations=[metrics.assets];}
  else if(valid(metrics.fixed_assets) && valid(metrics.current_assets) && cited(metrics.fixed_assets) && cited(metrics.current_assets)) {value=metrics.fixed_assets.value+metrics.current_assets.value;derivation='Fixed/non-current assets plus current assets, before liabilities';citations=[metrics.fixed_assets,metrics.current_assets];}
  if(!Number.isFinite(value) || value<=0) return unavailable;
  return {status:'available',basis:'balance_sheet_total',value,currency:'GBP',period_end:period.end,source_date:period.filed_at,source_reference:source.href,company_number:number,annual_verified:false,confidence:'Low',extraction:pdf ? 'pdf' : 'tagged',derivation,exemption:period.filing_exemption,citations:citations.map(metric=>({concept:metric.concept,value:metric.value,page:metric.page,quote:metric.quote})),...(pdf ? {pdf_file_uri:period.pdf_file_uri} : {}),limitation:'Turnover is unavailable under the accounts filing exemption. Balance-sheet total (total assets before liabilities) is used instead. This is a Low-confidence asset-based exposure proxy, not revenue concentration or an estimate of turnover; it does not enter turnover-based ASE scoring.'};
}