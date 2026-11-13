export function commercialDates(terms,date=new Date().toISOString().slice(0,10)) {
  const valid=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  if(valid(terms?.start) && valid(terms?.end)) {
    const days=(Date.parse(terms.end)-Date.parse(terms.start))/86400000+1;
    if(days>=2 && days<=36525) return {...terms,date_basis:terms.date_basis || 'project_programme'};
  }
  const year=Number(date.slice(0,4))-(date.slice(5,10)<'04-01'?1:0);
  return {start:`${year}-04-01`,end:`${year+1}-03-31`,date_basis:'current_financial_year',date_source:`Assumed current financial year ${year}/${String(year+1).slice(-2)} (1 April to 31 March); full fee included, not prorated`,programme_record_id:''};
}