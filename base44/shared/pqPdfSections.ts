import {questionnaireSections} from './projectQuestionnaireTemplate.ts';
export function pqPdfSections(pdf,project,answers,date){
 for(const section of questionnaireSections.filter(item=>item.id!=='access')){
  pdf.section(section.title);
  if(section.id==='contacts'){
   pdf.table(['Additional information','Comments / Response'],section.fields.filter(f=>f.id==='q17'||f.id==='project_lead').map(f=>[f.label,answers[f.id]||'Not recorded']));
   pdf.table(['Contact information','Main Client Contact','Site Contact'],[['position','Position/Title'],['name','Name'],['address','Address'],['phone','Telephone/Mobile No.'],['email','Email']].map(([id,label])=>[label,answers[`main_${id}`]||'Not recorded',answers[`site_${id}`]||'Not recorded']),[0.24,0.38,0.38]);continue;
  }
  let rows=[];
  const flush=()=>{if(rows.length){pdf.table(['Question / details','Comments / Response'],rows);rows=[];}};
  for(const field of section.fields){
   if(project.subject_type==='opportunity'&&field.id==='pq_number')continue;
   const value=answers[field.id];
   if(field.type==='heading'){flush();pdf.text(field.label,{bold:true});continue;}
   if(field.type==='checklist'){
    flush();pdf.checklist(field.label,field.options,Array.isArray(value)?value:[]);continue;
   }
   const display=field.type==='date'&&value?date(value):field.type==='select'?['Yes','No','N/A'].map(option=>`[${value===option?'X':' '}] ${option}`).join('    '):value;
   rows.push([field.label,display===0?'0':display||'Not recorded']);
  }
  flush();
 }
}