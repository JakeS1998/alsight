export const professionalIndemnityRule={version:'supplier-pi-v1',deduction_below:5000000,deduction:0.25,cap_below:2000000,cap:2.5,currency:'GBP'};
export const professionalIndemnityKey='insurance:professional_indemnity';
export function professionalIndemnitySnapshot(cover,now=new Date()) {
 const available=typeof cover==='number' && Number.isFinite(cover) && cover>=0;
 const deduction=available && cover<professionalIndemnityRule.deduction_below ? professionalIndemnityRule.deduction : 0,cap=available && cover<professionalIndemnityRule.cap_below ? professionalIndemnityRule.cap : null;
 const amount=available ? new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(cover) : null;
 return {rule_version:professionalIndemnityRule.version,available,cover_amount:available ? cover : null,currency:'GBP',deduction,cap,checked_at:now.toISOString(),reason:available ? `Recorded active professional indemnity cover ${amount}. ${deduction ? 'Deduct 0.25 overall ASE points for cover below £5m.' : 'No deduction: cover is at least £5m.'}${cap ? ' Overall ASE is capped at 2.5 because cover is below £2m.' : ''} Multiple policies are not added together.` : 'No usable active professional indemnity cover amount is recorded. Cover is unknown, not assumed to be zero; no deduction or cap is applied.'};
}
export async function supplierProfessionalIndemnity(db,account,now=new Date()) {
 if(account.account_type!=='supplier')return null;
 const aliases=[...new Set([account.id,account.dataverse_id,account.dataverse_id?.toLowerCase()].filter(Boolean))];
 const result=await db.SupplierInsurance.aggregate({query:{account_id:{$in:aliases},status:'active',policy_type:{$regex:'professional\\s+indemnity|^PI\\b',$options:'i'},cover_amount:{$gte:0}},max:'cover_amount'});
 if(result.truncated)throw new Error('Professional indemnity coverage could not be fully assessed.');
 const row=result.rows[0],snapshot=professionalIndemnitySnapshot(row?.max_cover_amount,now);
 return {...snapshot,policy_count:row?.count || 0,source_reference:`SupplierInsurance linked to Account ${account.id}`};
}
export function professionalIndemnityCheck(snapshot) {
 if(!snapshot)return null;
 return {key:professionalIndemnityKey,component:'esg',slot:'professional_indemnity',label:'Professional indemnity insurance',source:'ALSight supplier insurance',score:null,state:!snapshot.available ? 'UNAVAILABLE' : snapshot.deduction ? 'ADVERSE' : 'CLEAR',confidence:snapshot.available ? 'High' : 'Low',verified:snapshot.available,reason:snapshot.reason,checked_at:snapshot.checked_at,source_reference:snapshot.source_reference,cover_amount:snapshot.cover_amount,score_deduction:snapshot.deduction,score_cap:snapshot.cap,policy_count:snapshot.policy_count,rule_version:snapshot.rule_version,overall_score_adjustment:true};
}
export function insuranceAdjustedScore(score,insurance) {
 if(!Number.isFinite(score))return null;
 const deduction=insurance?.score_deduction ?? insurance?.deduction ?? 0;
 return Number(Math.max(1,score-deduction).toFixed(6));
}