import {ieError,ieRecord,ieText} from './ieAccess.ts';
export async function ieProjectContext(base44,item){
 if(!item.project_id)return null;
 const page=await base44.asServiceRole.entities.Project.filter({$or:[{id:item.project_id},{dataverse_id:item.project_id}]},{limit:1,fields:['name','project_number','dataverse_id','link_to_legals','link_to_project_questionnaire','link_to_riba4_report','link_to_pso','link_to_pcs']});
 return page.items[0]||null;
}
export async function ieProjectDocuments(base44,user,input){
 const item=await ieRecord(base44,user,input.engagement_id),project=await ieProjectContext(base44,item);
 if(!project||!/^PROJ/i.test(project.project_number||''))ieError('Project documents require a PROJ number.',403);
 const kinds={legal:'LegalDocument',dma:'DMA',jct:'JCT'},kind=ieText(input.kind,20);
 if(!kinds[kind])ieError('Choose a project document type.');
 // Engagement access authorises only this linked project's read-only document metadata.
 const page=await base44.asServiceRole.entities[kinds[kind]].filter({project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)},status:{$ne:'inactive'}},{sort:'-created_date',limit:30,fields:['document_id','document_type','executed','date_of_execution','drafted_date','approval_status','link_to_file','comments'],...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
 return page;
}