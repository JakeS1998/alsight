import {extractAppointmentFee} from './appointmentFeeExtraction.ts';
import {appointmentRoles} from './appointmentSignedSource.ts';
export async function supplierAppointmentStep(base44,user,job,account){
 const page=await base44.entities.LegalDocument.filter({account_id:{$in:[account.id,account.dataverse_id].filter(Boolean)},executed:'yes',document_type:{$in:Object.keys(appointmentRoles)}},{sort:'created_date',limit:1,...(job.appointment_cursor?{cursor:job.appointment_cursor}:{})});
 let note='';
 if(page.items[0]&&!(page.items[0].total_fees>0)){try{const r=await extractAppointmentFee(base44,user,page.items[0],account);if(r.status==='error'||r.status==='unusable')note=`${page.items[0].document_id}: ${r.note}`;}catch(error){note=String(error.message).slice(0,500);}}
 await base44.asServiceRole.entities.SupplierCommercialCheck.update(job.id,{status:'queued',stage:page.has_more?'appointments':'calculate',appointment_cursor:page.has_more?page.next_cursor:'',appointments_checked:!page.has_more,token:crypto.randomUUID(),note:[job.note,note].filter(Boolean).join(' ').slice(-2000)});
 return {continuing:true};
}