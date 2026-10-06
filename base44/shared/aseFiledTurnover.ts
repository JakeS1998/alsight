import {normalisePdfAccounts} from './aseAccountsPdfValidation.ts';

export function filedTurnoverPeriod(period,number,now=new Date(),maxAgeDays=913) {
  if(!period?.metrics?.revenue)return {status:'unavailable',reason:'Turnover is not disclosed in the available accounts. No revenue is inferred from other financial figures.'};
  const metric=period.metrics.revenue;
  const days=(Date.parse(metric.end)-Date.parse(metric.start))/86400000+1,age=(now.getTime()-Date.parse(period.end))/86400000;
  let source;try {source=new URL(period.source_url);}catch {return {status:'unavailable',reason:'The filed turnover source reference is invalid.'};}
  if(metric.annual!==true || !Number.isFinite(days) || !Number.isFinite(age) || !Number.isFinite(Date.parse(period.filed_at)) || metric.end!==period.end || days<365 || days>366 || !(metric.value>0) || !Number.isFinite(metric.value) || age<0 || age>maxAgeDays || Date.parse(period.filed_at)<Date.parse(period.end) || Date.parse(period.filed_at)>now.getTime() || source.protocol!=='https:' || source.hostname!=='find-and-update.company-information.service.gov.uk' || !source.pathname.startsWith(`/company/${number}/filing-history/`))return {status:'unavailable',reason:'The latest disclosed turnover is stale, non-annual, non-positive or has invalid filing provenance.'};
  const pdf=period.origin==='pdf';
  if(pdf) {
    const parsed=normalisePdfAccounts({company_number:number,currency:'GBP',entity_basis:'company',periods:[{end:period.end,start:metric.start,metrics:[{key:'revenue',value:metric.value/metric.multiplier,multiplier:metric.multiplier,page:metric.page,quote:metric.quote}]}]},number,period.filed_at);
    if(metric.concept!=='PDF:revenue' || !period.pdf_file_uri || parsed[0]?.metrics.revenue?.value!==metric.value || !/\b(?:turnover|revenue)\b/i.test(metric.quote || ''))return {status:'unavailable',reason:'The latest filed PDF turnover lacks a usable company-only annual figure and page citation.'};
  } else if(!/(?:^|:)(?:TurnoverRevenue|Revenue|Turnover)$/.test(metric.concept || ''))return {status:'unavailable',reason:'The latest financial figure is not a supported total-turnover disclosure.'};
  return {status:'available',value:metric.value,currency:'GBP',period_start:metric.start,period_end:period.end,source_reference:source.href,source_date:period.filed_at,company_number:number,annual_verified:!pdf,confidence:pdf ? 'Low' : 'High',extraction:pdf ? 'pdf' : 'tagged',...(pdf ? {page:metric.page,quote:metric.quote,pdf_file_uri:period.pdf_file_uri,limitation:'Latest company-only annual turnover extracted from the Companies House filed accounts PDF. Low confidence: the cited figure has not been independently verified; the concentration comparison is indicative.'} : {})};
}