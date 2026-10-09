import {insuranceReportWindow,insuranceReportDate,insuranceReportDay} from './insuranceReportDates.ts';
import {insuranceReportSuppliers} from './insuranceReportSuppliers.ts';
import {insuranceReportMarkup} from './insuranceReportMarkup.ts';
async function allPolicies(db,query) {
 const rows=[];let cursor;
 do{const page=await db.SupplierInsurance.filter(query,{sort:'expiry_date',limit:100,cursor,fields:['name','account_id','policy_type','policy_number','insurer','cover_amount','expiry_date','status']});rows.push(...page.items);cursor=page.has_more ? page.next_cursor : undefined;}while(cursor);
 return rows;
}
export async function insuranceReportData(base44) {
 const db=base44.asServiceRole.entities,window=insuranceReportWindow(),accounts=await insuranceReportSuppliers(base44);
 const ids=[...new Set(accounts.flatMap(account=>[account.id,account.dataverse_id]))],supplierScope={account_id:{$in:ids}};
 const expiredQuery={...supplierScope,expiry_date:{$exists:true,$nin:[null,''],$lt:window.start}},expiringQuery={...supplierScope,expiry_date:{$gte:window.start,$lt:window.end}};
 const expiredCount=ids.length ? await db.SupplierInsurance.count(expiredQuery) : 0,expiringCount=ids.length ? await db.SupplierInsurance.count(expiringQuery) : 0;
 const expired=ids.length ? await allPolicies(db,expiredQuery) : [],expiring=ids.length ? await allPolicies(db,expiringQuery) : [];
 const categoryReport=insuranceReportMarkup(expired,expiring,accounts,window);
 // Keep the existing email variable contract so scheduled recipient steps remain unchanged.
 return {report_date:insuranceReportDate(`${window.today}T12:00:00Z`),window_end:insuranceReportDate(`${window.lastDay}T12:00:00Z`),expired_count:expiredCount,expiring_count:expiringCount,expired_rows:categoryReport,expiring_rows:''};
}