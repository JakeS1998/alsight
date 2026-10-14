import {readPsoApprovals} from './psoApprovalMapping.ts';
export const psoDateFields=['pso_pq_date','pso_aa_date','pso_aa_variations_date','pso_dma_date'];
export async function importProjectPso(db,reads,project,preview=false) {
 if(!project.link_to_pso)throw new Error('No PSO workbook linked to this project.');
 const result=await readPsoApprovals(reads,project.link_to_pso),importedFields=Object.keys(result.updates);
 if(preview || !importedFields.length)return {...result,importedFields};
 const {items}=await db.ProjectDelivery.filter({project_id:project.id},{sort:'-created_date',limit:1});
 const current=items[0],pso_workbook_fields=[...new Set([...(current?.pso_workbook_fields||[]),...importedFields])];
 const payload={...result.updates,pso_workbook_fields};
 if(current)await db.ProjectDelivery.update(current.id,payload);
 else await db.ProjectDelivery.create({...payload,project_id:project.id,client_account_id:project.client_account_id||null,bdm_aad_id:project.bdm_aad_id||null});
 return {...result,importedFields};
}
export async function checkOutstandingPso(db,reads,cursor) {
 const page=await db.Project.filter({status:'active',live_project:true,link_to_pso:{$exists:true,$nin:[null,'']}},{sort:'id',limit:9,fields:['name','dataverse_id','link_to_pso','client_account_id','bdm_aad_id'],...(cursor?{cursor}:{})});
 const results=[];
 for(let i=0;i<page.items.length;i+=3) {
  const outcomes=await Promise.all(page.items.slice(i,i+3).map(async project=>{
   try {
    const {items}=await db.ProjectDelivery.filter({project_id:project.id},{sort:'-created_date',limit:1,fields:psoDateFields});
    if(items[0] && psoDateFields.every(field=>!!items[0][field]))return {project:project.name,status:'complete_skipped'};
    const result=await importProjectPso(db,reads,project);
    return {project:project.name,status:'checked',importedFields:result.importedFields,warnings:result.warnings};
   }catch(error){console.warn('PSO check failed',project.id,error.message);return {project:project.name,status:'error',error:error.message};}
  }));results.push(...outcomes);
 }
 return {results,hasMore:page.has_more,cursor:page.next_cursor||null};
}