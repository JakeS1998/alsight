import {insuranceReportWindow,insuranceReportDate,insuranceReportDay} from './insuranceReportDates.ts';
const escape=value=>String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>value==null ? 'Not recorded' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
async function allPolicies(db,query) {
 const rows=[];let cursor;
 do{const page=await db.SupplierInsurance.filter(query,{sort:'expiry_date',limit:100,cursor,fields:['name','account_id','policy_type','policy_number','insurer','cover_amount','expiry_date','status']});rows.push(...page.items);cursor=page.has_more ? page.next_cursor : undefined;}while(cursor);
 return rows;
}
export async function insuranceReportData(base44) {
 const db=base44.asServiceRole.entities,window=insuranceReportWindow();
 const expiredQuery={expiry_date:{$exists:true,$nin:[null,''],$lt:window.start}},expiringQuery={expiry_date:{$gte:window.start,$lt:window.end}};
 const expiredCount=await db.SupplierInsurance.count(expiredQuery),expiringCount=await db.SupplierInsurance.count(expiringQuery);
 const expired=await allPolicies(db,expiredQuery),expiring=await allPolicies(db,expiringQuery),ids=[...new Set([...expired,...expiring].map(p=>p.account_id).filter(Boolean))],accounts=[];
 for(let offset=0;offset<ids.length;offset+=100){let cursor;do{const page=await db.Account.filter({$or:[{id:{$in:ids.slice(offset,offset+100)}},{dataverse_id:{$in:ids.slice(offset,offset+100)}}]},{limit:100,cursor,fields:['name','dataverse_id']});accounts.push(...page.items);cursor=page.has_more ? page.next_cursor : undefined;}while(cursor);}
 const cells=values=>values.map(value=>`<td style="padding:10px 7px;border-bottom:1px solid #e5e7eb;vertical-align:top;word-break:break-word;">${value}</td>`).join('');
 const rows=policies=>policies.length ? policies.map(policy=>{
  const account=accounts.find(a=>a.id===policy.account_id || a.dataverse_id===policy.account_id),supplier=account ? `<a href="https://alsight.base44.app/accounts/${encodeURIComponent(account.id)}?tab=insurance" style="color:#102642;">${escape(account.name)}</a>` : escape(`Unmatched account (${policy.account_id || 'not recorded'})`);
  const days=Math.round((Date.parse(`${insuranceReportDay(policy.expiry_date)}T00:00:00Z`)-Date.parse(`${window.today}T00:00:00Z`))/86400000),timing=days<0 ? `${-days} days overdue` : days===0 ? 'Expires today' : `In ${days} days`;
  return `<tr>${cells([supplier,`${escape(policy.name)}<br/><span style="color:#5f7586;font-size:12px;">${escape(policy.policy_type || 'Type not recorded')}<br/>${escape(policy.policy_number || 'Number not recorded')}${policy.status==='inactive' ? '<br/>Inactive record' : ''}</span>`,escape(policy.insurer || 'Not recorded'),escape(money(policy.cover_amount)),escape(insuranceReportDate(policy.expiry_date)),escape(timing)])}</tr>`;
 }).join('') : '<tr><td colspan="6" style="padding:16px 7px;color:#5f7586;">No policies in this category.</td></tr>';
 return {report_date:insuranceReportDate(`${window.today}T12:00:00Z`),window_end:insuranceReportDate(`${window.lastDay}T12:00:00Z`),expired_count:expiredCount,expiring_count:expiringCount,expired_rows:rows(expired),expiring_rows:rows(expiring)};
}