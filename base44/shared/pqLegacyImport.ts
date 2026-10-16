import {pqSourceDocument} from './pqSourceDocument.ts';
import {questionnaireVersion} from './projectQuestionnaireTemplate.ts';
import {pqSubjectLinks} from './pqSubject.ts';
export async function pqLegacyImport(base44,project,current,retry=false){
 const url=project.link_to_project_questionnaire;
 if(project.subject_type!=='project'||!url||current?.approval_round_id)return current;
 const previous=current?.source_import;
 if(previous?.link===url&&previous.parser_version===3&&!retry)return current;
 if(previous?.link===url&&previous?.attempted_at&&Date.now()-Date.parse(previous.attempted_at)<60000){const error=new Error('Wait one minute after the last import attempt before retrying.');error.status=429;throw error;}
 const now=new Date().toISOString(),db=base44.asServiceRole.entities;
 let source_import,answers=current?.answers||{};
 try{
  const result=await pqSourceDocument(base44,project);
  // Retain existing digital answers; populate previously empty fields from the source.
  answers={...result.answers,...Object.fromEntries(Object.entries(answers).filter(([,value])=>Array.isArray(value)?value.length:typeof value==='string'&&!!value.trim()))};
  answers.pq_number=project.project_number||answers.pq_number||'';
  source_import={status:'imported',parser_version:3,link:url,document_name:result.name,document_url:result.url,evidence:{...previous?.evidence,...result.evidence},pages:result.pages,method:result.method,attempted_at:now,imported_at:now,approval_basis:'Existing project PQ date',approved_at:project.pq_approval_date||null};
 }catch(error){source_import={status:'error',parser_version:3,link:url,attempted_at:now,error:String(error.message).slice(0,1000)};}
 // Recheck saved source before committing an import that may have taken time.
 const latest=await base44.entities.Project.get(project.id);
 if(latest.link_to_project_questionnaire!==url)throw new Error('The PQ link changed during import. Reload the questionnaire.');
 const payload={answers,source_import,template_version:current?.template_version||questionnaireVersion,revision:(current?.revision||0)+1,save_token:crypto.randomUUID(),saved_by:'SharePoint PQ import',saved_at:now,status:current?.status||'draft'};
 return current?await db.ProjectQuestionnaire.update(current.id,payload):await db.ProjectQuestionnaire.create({...payload,...pqSubjectLinks(project)});
}