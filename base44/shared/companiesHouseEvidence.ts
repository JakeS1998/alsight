import { publicOrigin,sectionItems } from './companiesHouseData.ts';
export function companiesHouseEvidence(account,raw,audit) {
  const p=raw.sections.profile.pages[0].data,now=audit.refreshed_at,today=now.slice(0,10),number=audit.company_number;
  const url=`${publicOrigin}/company/${number}`,rows=[];
  function add(key,component,title,value,type='compliance',severity='none',eligible=false,notes='',reference=url,confidence='High') {
    rows.push({external_key:`ch:${account.id}:${number}:${key}`,account_id:account.id,assessment_id:null,company_number:number,component,title,value:String(value).slice(0,200),source:'Companies House',evidence_type:type,severity,confidence,score_eligible:eligible,reporting_period:today,source_date:today,retrieval_date:now,source_reference:reference,source_refresh_id:audit.id,raw_file_uri:audit.raw_file_uri,notes:notes.slice(0,1000),is_demo:false});
  }
  add('status','company_status','Registered company legal status',p.company_status || 'Not provided','compliance','none',false,'Registry status is an identity fact, not a financial-health conclusion.');
  const overdue=[];
  for (const [key,info] of [['accounts',p.accounts?.next_accounts],['confirmation',p.confirmation_statement]]) {
    const due=key==='accounts' ? info?.due_on || p.accounts?.next_due : info?.next_due;
    const flag=key==='accounts' ? info?.overdue ?? p.accounts?.overdue : info?.overdue;
    const days=due && Number.isFinite(Date.parse(due)) ? Math.max(0,Math.floor((Date.parse(today)-Date.parse(due))/86400000)) : null;
    if(flag===true) overdue.push({key,days});
    add(key,`${key}_filing_status`,key==='accounts' ? 'Accounts filing status' : 'Confirmation statement filing status',flag===true ? 'Overdue' : flag===false ? 'Not marked overdue' : 'Not provided','compliance',flag===true ? 'moderate' : 'none',false,`Due date: ${due || 'Not provided'}. Historic lateness is not inferred from a current filing status.`,url+'/filing-history');
  }
  const strike=String(p.company_status_detail || p.company_status).includes('proposal-to-strike-off');
  const known=overdue.length && overdue.every(row=>row.days!=null && row.days>0);
  const worst=known ? Math.max(...overdue.map(row=>row.days)) : null;
  const compliance=strike ? 1 : worst==null ? null : worst>90 ? 1 : worst>30 ? 2 : 3;
  add('compliance','compliance','Current statutory filing / strike-off check',compliance ?? 'Current history not fully verified','compliance',compliance<=2 && compliance!=null ? 'material' : compliance===3 ? 'moderate' : 'none',compliance!=null,compliance!=null ? 'Mapped deterministically to the approved ASE overdue/strike-off thresholds. No overall rating has been chosen.' : 'No favourable compliance score inferred: complete historic filing timeliness is not verified.');
  const active=['liquidation','administration','receivership','administrative-receiver','insolvency-proceedings'].includes(p.company_status);
  const cases=sectionItems(raw,'insolvency'),section=raw.sections.insolvency;
  add('insolvency','adverse','Companies House insolvency check',active ? '1' : cases.length ? 'Historical / unresolved case status requires review' : section?.complete ? 'No Companies House insolvency record returned' : 'Check unavailable','event',active ? 'serious' : cases.length ? 'moderate' : 'none',active,'Only a current insolvency legal status maps to the approved adverse-event rule. Historical cases require review; this check does not establish absence of Gazette or other adverse events.',url+'/insolvency',section?.complete ? 'High' : 'Low');
  const charges=sectionItems(raw,'charges'),chargeSection=raw.sections.charges;
  const outstanding=charges.filter(c=>['outstanding','part-satisfied'].includes(c.status)).length;
  add('charges','charges','Registered charges',chargeSection?.complete ? `${outstanding} outstanding / part-satisfied charges retrieved` : `At least ${outstanding} outstanding / part-satisfied charges retrieved; check incomplete`,'event','none',false,'A charge is security registration, not evidence of financial distress. It is not converted to a debt ratio or an adverse-event score.',url+'/charges',chargeSection?.complete ? 'High' : 'Low');
  const officers=sectionItems(raw,'officers'),recent=officers.filter(o=>[o.appointed_on,o.resigned_on].some(date=>date && Date.parse(date)<=Date.parse(now) && Date.parse(date)>=Date.parse(now)-90*86400000));
  add('officers','officer_changes','Recent officer changes',`${recent.length} appointments/resignations found in retrieved records within 90 days`,'governance','none',false,'Officer changes are contextual governance facts, not automatic adverse events. '+(raw.sections.officers.complete ? 'Officer collection retrieved completely.' : 'Officer collection incomplete.'),url+'/officers',raw.sections.officers.complete ? 'High' : 'Low');
  return rows;
}