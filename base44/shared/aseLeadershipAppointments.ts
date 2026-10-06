import {leadershipAudit} from './aseLeadershipIdentity.ts';
export async function screenOfficerAppointments(subject,ch,policy) {
  if(!subject.officer_id) return leadershipAudit(subject,'appointments','UNAVAILABLE','No reliable Companies House officer appointment identifier is available.');
  const result=await ch.list('/officers/'+subject.officer_id+'/appointments',200),rows=result.items.filter(r=>r.appointed_to?.company_number!==subject.company_number),failures=[],companies=[];let verified=true,checked=0;
  for(const row of rows) {
    const company=row.appointed_to || {},number=company.company_number;companies.push({number,name:company.company_name,status:company.company_status,appointed_on:row.appointed_on,resigned_on:row.resigned_on || '',role:row.officer_role,reference:'https://find-and-update.company-information.service.gov.uk/company/'+number});
    if(!['liquidation','administration','receivership','administrative-receiver','dissolved'].includes(company.company_status)) continue;
    if(++checked>8){verified=false;continue;}
    if(!/^[A-Za-z0-9]{8}$/.test(number || '')) {verified=false;continue;}
    const raw=await ch.get('/company/'+number+'/insolvency',true);if(!raw) continue;
    for(const item of raw.cases || []) {
      if(!['liquidation','administration','receivership','administrative-receiver'].includes(item.type)) continue;
      const dates=(item.dates || []).filter(d=>['wound-up-on','winding-up-order','administration-started-on','administration-start','order-of-court'].includes(d.type));if(!dates.length){verified=false;continue;}
      for(const d of dates) if(d.date && row.appointed_on && d.date>=row.appointed_on && (!row.resigned_on || d.date<=row.resigned_on) && Date.parse(d.date)<=Date.now() && Date.now()-Date.parse(d.date)<=policy.recent_days*86400000) failures.push({company_number:number,date:d.date,reference:'https://find-and-update.company-information.service.gov.uk/company/'+number+'/insolvency',fact_key:'company-failure:'+number+':'+d.date});
    }
  }
  const distinct=[...new Map(failures.map(f=>[f.company_number,f])).values()];
  return leadershipAudit(subject,'appointments',result.complete && verified ? 'CLEAR' : 'MANUAL REVIEW',`${result.items.length} appointment records retrieved; ${distinct.length} distinct recent insolvency events verified while the officer held an appointment. A single association, dissolution alone or a resignation before the event is not penalised.`,{matching_confidence:'High',evidence_reference:'https://api.company-information.service.gov.uk/officers/'+subject.officer_id+'/appointments',complete:result.complete && verified,current_appointments:result.items.filter(r=>!r.resigned_on).length,previous_appointments:result.items.filter(r=>r.resigned_on).length,companies:companies.slice(0,30),company_records_truncated:companies.length>30,failures:distinct});
}