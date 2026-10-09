import {insuranceReportDate,insuranceReportDay} from './insuranceReportDates.ts';
const escape=value=>String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>value==null ? 'Not recorded' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
const cell=value=>`<td style="padding:10px 7px;border-bottom:1px solid #e5e7eb;vertical-align:top;word-break:break-word;">${value}</td>`;
const headings=['Supplier','Policy','Insurer','Cover','Expiry','Timing'];
export function insuranceReportMarkup(expired,expiring,accounts,window) {
 const byId=new Map(accounts.flatMap(account=>[[account.id,account],[account.dataverse_id,account]])),groups=new Map();
 const row=policy=>{
  const account=byId.get(policy.account_id),supplier=`<a href="https://alsight.base44.app/accounts/${encodeURIComponent(account.id)}?tab=insurance" style="color:#102642;">${escape(account.name)}</a>${account.categories.length>1 ? `<br/><span style="font-size:12px;color:#5f7586;">${escape(account.categories.join(', '))}</span>` : ''}`;
  const days=Math.round((Date.parse(`${insuranceReportDay(policy.expiry_date)}T00:00:00Z`)-Date.parse(`${window.today}T00:00:00Z`))/86400000),timing=days<0 ? `${-days} days overdue` : days===0 ? 'Expires today' : `In ${days} days`;
  return `<tr>${[supplier,`${escape(policy.name)}<br/><span style="color:#5f7586;font-size:12px;">${escape(policy.policy_type || 'Type not recorded')}<br/>${escape(policy.policy_number || 'Number not recorded')}${policy.status==='inactive' ? '<br/>Inactive record' : ''}</span>`,escape(policy.insurer || 'Not recorded'),escape(money(policy.cover_amount)),escape(insuranceReportDate(policy.expiry_date)),escape(timing)].map(cell).join('')}</tr>`;
 };
 for(const [status,policies] of [['expired',expired],['expiring',expiring]])for(const policy of policies){
  const account=byId.get(policy.account_id);if(!account)throw new Error('A policy supplier could not be verified for this report.');
  if(!groups.has(account.category))groups.set(account.category,{expired:[],expiring:[]});groups.get(account.category)[status].push(row(policy));
 }
 const order=label=>label==='Principal Contractor' ? 0 : label==='Category not recorded' ? 2 : 1;
 const table=rows=>`<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:Arial Narrow,Arial,sans-serif;font-size:13px;line-height:1.4;color:#102642;"><thead><tr style="background:#eaf4fb;text-align:left;">${headings.map(title=>`<th style="padding:10px 7px;">${title}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : '<tr><td colspan="6" style="padding:16px 7px;color:#5f7586;">No policies in this category.</td></tr>'}</tbody></table>`;
 const html=[...groups.entries()].sort(([a],[b])=>order(a)-order(b) || a.localeCompare(b,'en-GB')).map(([label,group])=>`<div style="margin-bottom:32px;"><h2 style="margin:0 0 16px;font-size:22px;color:#102642;">${escape(label)}</h2><h3 style="margin:0 0 10px;font-size:17px;color:#102642;">Expired policies</h3>${table(group.expired)}<h3 style="margin:24px 0 10px;font-size:17px;color:#102642;">Expiring within the next 28 days</h3>${table(group.expiring)}</div>`).join('');
 return html || '<p style="color:#5f7586;">No expired supplier policies or supplier policies expiring within the next 28 days.</p>';
}