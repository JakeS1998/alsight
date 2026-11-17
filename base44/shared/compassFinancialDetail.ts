const labels={financial_strength:'Net assets as a share of total assets',financial_trend:'Annual revenue change',liquidity:'Current assets ÷ current liabilities',debt:'Net borrowings as a share of total assets',reserves:'Usable reserves as a share of expenditure',reserves_trend:'Annual change in reserves ratio',budget:'Outturn compared with budget',borrowing:'Capital financing costs as a share of expenditure'};
const meanings={strength:'Shows the financial buffer available relative to the organisation’s assets or expenditure.',trend:'Shows whether comparable annual revenue, or the council’s usable reserves ratio, increased or decreased.',liquidity:'Shows short-term asset cover for liabilities, or the council’s completed outturn against budget.',debt:'Shows net borrowing relative to assets, or the council’s capital financing burden.'};
const amount=value=>Number(String(value).replace(/^GBP\s*/,''));
const money=value=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
export function compassFinancialDetail(check,row,rows,policy) {
  if(!row)return null;
  const value=Number(row.value),unit=row.component==='liquidity'?'ratio':row.component==='reserves_trend'?'points':'percent';
  if(!Number.isFinite(value))return null;
  const rule=(row.component.startsWith('reserves') || ['budget','borrowing'].includes(row.component)?policy?.council_financial_rules:policy?.financial_rules)?.[check.slot];
  const figures=[{label:labels[row.component] || row.component,value,unit,period:row.reporting_period}];
  let chart={title:labels[row.component] || row.component,unit,points:rows.filter(r=>r.component===row.component && r.automatic_eligible && Number.isFinite(Number(r.value))).map(r=>({date:r.reporting_period,value:Number(r.value)})).sort((a,b)=>a.date.localeCompare(b.date))};
  let why=`The recorded ${labels[row.component]?.toLowerCase() || 'financial measure'} is ${value.toFixed(2)}${unit==='ratio'?' times':unit==='points'?' percentage points':'%'}. This gives the saved check score of ${check.score?.toFixed(2)}/5.`;
  if(row.component==='financial_trend') {
    const pair=String(row.notes || '').match(/Annual GBP revenue ([\d.]+) versus ([\d.]+) for (\d{4}-\d{2}-\d{2})/);
    if(pair) {
      const current=Number(pair[1]),previous=Number(pair[2]),change=current-previous;
      figures.unshift({label:'Previous annual revenue',value:previous,unit:'GBP',period:pair[3]},{label:'Latest annual revenue',value:current,unit:'GBP',period:row.reporting_period},{label:'Revenue change',value:change,unit:'GBP'});
      chart={title:'Filed annual revenue',unit:'GBP',points:[{date:pair[3],value:previous},{date:row.reporting_period,value:current}]};
      why=`Annual revenue ${change<0?'fell':change>0?'rose':'was unchanged'} from ${money(previous)} to ${money(current)}${change===0?'':`, a ${change<0?'decrease':'increase'} of ${money(Math.abs(change))} (${Math.abs(value).toFixed(2)}%)`}. The saved revenue-trend score is ${check.score?.toFixed(2)}/5. The filings show the change, but do not establish its business cause.`;
    }
  } else if(row.source==='Companies House filed accounts') {
    const needed={strength:['net_assets','assets','current_assets','fixed_assets'],liquidity:['current_assets','current_liabilities'],debt:['borrowings','cash','assets','current_assets','fixed_assets']}[check.slot] || [];
    for(const key of needed) {const r=rows.find(r=>r.reporting_period===row.reporting_period && r.component==='filed_financials' && r.external_key?.endsWith('-'+key));if(r && Number.isFinite(amount(r.value)))figures.push({label:key.replaceAll('_',' '),value:amount(r.value),unit:'GBP',period:r.reporting_period});}
  }
  const prior=chart.unit===unit?chart.points.filter(p=>p.date<row.reporting_period).at(-1):null;
  if(prior)figures.push({label:'Previous comparable measure',value:prior.value,unit,period:prior.date},{label:unit==='percent'?'Change in ratio':'Change in measure',value:value-prior.value,unit:unit==='percent'?'points':unit});
  const bands=rule?.thresholds?.map((boundary,index)=>({label:index===0?`${rule.strict?'At or below':'Below'} ${boundary}${unit==='ratio'?'×':unit==='points'?' pp':'%'}`:`${rule.strict?'Above':'From'} ${rule.thresholds[index-1]} ${rule.strict?'to':'to below'} ${boundary}${unit==='ratio'?'×':unit==='points'?' pp':'%'}`,score:rule.descending?5-index:1+index})) || [];
  if(rule?.thresholds?.length)bands.push({label:`${rule.strict?'Above':'At or above'} ${rule.thresholds.at(-1)}${unit==='ratio'?'×':unit==='points'?' pp':'%'}`,score:rule.descending?1:5});
  return {meaning:meanings[check.slot],why,figures,chart,bands,formula:row.notes?.split('. Automatic')[0] || '',limitation:row.confidence==='Low'?'These reported figures have Low evidence confidence; extraction or uncertified inputs have not been independently verified.':null};
}