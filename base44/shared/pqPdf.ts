import {questionnaireSections} from './projectQuestionnaireTemplate.ts';
import {pqRecordedApproval} from './pqProjectLock.ts';
import {pqPdfLayout} from './pqPdfLayout.ts';
export function pqPdf(project,record,round){
 if(!record){const error=new Error('Save the questionnaire before exporting it.');error.status=400;throw error;}
 const answers=record.answers||{},historical=pqRecordedApproval(project),pdf=pqPdfLayout(project.project_number||project.name);
 const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('en-GB',{timeZone:'Europe/London'}):'Not recorded';
 pdf.text(project.name,{bold:true,size:16});
 pdf.text(`Client: ${answers.client||project.client_name||'Not recorded'}`);
 pdf.text(`Status: ${historical?'Approved (historical project record)':record.status==='submitted'?'Submitted':'Draft'} | Saved revision: ${record.revision}`);
 pdf.text(`Exported: ${new Date().toLocaleString('en-GB',{timeZone:'Europe/London'})}`);
 pdf.text('Generated from saved digital answers. This export is not the original signed source document.',{size:9});
 questionnaireSections.filter(section=>section.id!=='access').forEach((section,index)=>{
  pdf.section(`${index+1}. ${section.title}`);
  for(const field of section.fields){
   if(project.subject_type==='opportunity'&&field.id==='pq_number')continue;
   if(field.type==='heading'){pdf.text(field.label,{bold:true,size:11});continue;}
   const value=answers[field.id];
   pdf.field(field.label,field.type==='checklist'?(Array.isArray(value)&&value.length?value.join(', '):'No selection recorded'):field.type==='date'&&value?date(value):value);
  }
 });
 pdf.section(project.subject_type==='opportunity'?'Questionnaire approval':'8. Framework Access Approval');
 if(historical||answers.access_name||answers.access_position||answers.access_date){
  pdf.text(historical?'Recorded historical approval: Approved':'Historical source details recorded',{bold:true});
  pdf.field('Approver',answers.access_name);pdf.field('Position',answers.access_position);
  pdf.field('Approval date',date(answers.access_date||historical?.approvedAt));
  pdf.text('Historical source evidence only. No new email-verified approval or signature is created by this export.',{size:9});
 }
 if(round){
  pdf.text(`Sequential approval: ${round.status} | Issued version: ${round.reference}`,{bold:true});
  for(const [index,step] of (round.steps||[]).entries()){
   pdf.field(`${index+1}. ${step.name||'Approver'}`,`${step.email||''}\nStatus: ${step.status}${step.verification_method==='email_otp'?' (email verified)':''}${step.decided_at?'\nDecision date: '+date(step.decided_at):''}${step.comment?'\nComments: '+step.comment:''}`);
  }
 }else pdf.text('No verified approval sequence recorded.');
 if(record.source_import?.document_name){pdf.text(`Source: ${record.source_import.document_name}`,{size:9});pdf.text(`Imported: ${date(record.source_import.imported_at)}`,{size:9});}
 const bytes=pdf.finish();let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return {content:btoa(binary),mime:'application/pdf',filename:`PQ-${String(project.project_number||project.name).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)}.pdf`};
}