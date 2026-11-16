import {insuranceReportCategory,insuranceReportCategoryOrder} from './insuranceReportCategory.ts';
import {insuranceReportDay} from './insuranceReportDates.ts';
export function insuranceReportExportRows(policies,accounts,window) {
 const suppliers=new Map(accounts.flatMap(a=>[[a.id,a],[a.dataverse_id,a]]));
 return policies.map(policy=>{
  const account=suppliers.get(policy.account_id);if(!account)throw new Error('Insurance export supplier could not be verified.');
  const renewal=insuranceReportDay(policy.renewal_date),days=Math.round((Date.parse(renewal+'T00:00:00Z')-Date.parse(window.today+'T00:00:00Z'))/86400000);
  return {category:insuranceReportCategory(account),supplier:account.name,policy:policy.policy_type||'Type not recorded',number:policy.policy_number||'Not recorded',cover:policy.cover_amount??null,renewal,days,timing:days<0?`${-days} days overdue`:days===0?'Expires today':`In ${days} days`,supplier_url:`https://als-hub.base44.app/accounts/${encodeURIComponent(account.id)}?tab=insurance`,source_url:policy.dataverse_id?`https://alslive.crm11.dynamics.com/main.aspx?appid=e986c390-c4b0-f011-bbd3-6045bd0e7eeb&pagetype=entityrecord&etn=bss_supplierinsurance&id=${encodeURIComponent(policy.dataverse_id)}`:''};
 }).sort((a,b)=>insuranceReportCategoryOrder.indexOf(a.category)-insuranceReportCategoryOrder.indexOf(b.category)||a.supplier.localeCompare(b.supplier,'en-GB')||a.renewal.localeCompare(b.renewal)||a.policy.localeCompare(b.policy,'en-GB'));
}