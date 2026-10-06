export function validateV2Input(input,account,user) {
  const today=new Date().toISOString().slice(0,10),validDate=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value && value<=today;
  if(input.confirmed!==true || !['turnover','experience'].includes(input.input_type) || typeof input.evidence_reference!=='string' || !input.evidence_reference.trim() || input.evidence_reference.length>500) throw new Error('Confirm structured evidence and provide its document or ALSight record reference.');
  const result={account_id:account.id,input_type:input.input_type,evidence_reference:input.evidence_reference.trim(),verified_by:user.id,verification_note:String(input.verification_note || '').slice(0,600)};
  if(input.input_type==='turnover') {
    if(!Number.isFinite(input.turnover_value) || input.turnover_value<=0 || input.turnover_value>1e13 || !validDate(input.period_end) || !validDate(input.obtained_at) || input.obtained_at<input.period_end || !['declared','internal','external'].includes(input.evidence_origin) || input.annual_company_gbp!==true) throw new Error('Supply positive annual company-only GBP turnover, completed accounts period, date obtained and source origin; confirm this is not group turnover.');
    Object.assign(result,{turnover_value:input.turnover_value,period_end:input.period_end,obtained_at:input.obtained_at,evidence_origin:input.evidence_origin});
  } else {
    if(!['excellent','satisfactory','resolved_issue','unresolved_material','serious_unresolved'].includes(input.outcome) || !validDate(input.event_date)) throw new Error('Choose a structured documented outcome and its event date; do not classify casual comments.');
    Object.assign(result,{outcome:input.outcome,event_date:input.event_date});
  }
  return result;
}