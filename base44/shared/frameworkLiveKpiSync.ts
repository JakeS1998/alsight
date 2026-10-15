import {frameworkLiveKpiValues} from './frameworkLiveKpiValues.ts';
const projectFields=['name','project_number','dataverse_id','procurement_route','status','live_project','practical_completion_date','aa_executed_date','construction_term_weeks',...[1,2,3,4,5].map(n=>`riba${n}_system_date`),...[1,2,3,4].flatMap(n=>[`riba${n}_end`,`riba${n}_term_weeks`])];
export async function syncFrameworkLiveKpis(db,projects) {
 const eligible=projects.filter(project=>project?.procurement_route===true && project.status!=='inactive');if(!eligible.length)return {updated:0,skipped:0};
 const ids=eligible.map(p=>p.id),aliases=eligible.flatMap(p=>[p.id,p.dataverse_id]).filter(Boolean);
 const [reportPage,deliveryPage]=await Promise.all([db.FrameworkProjectReport.filter({project_id:{$in:aliases}},{limit:500}),db.ProjectDelivery.filter({project_id:{$in:ids}},{limit:500,fields:['project_id','contract_sum','original_pc','lad_completion_date','pc_achieved']})]);
 if(reportPage.has_more || deliveryPage.has_more)throw new Error('Live KPI records exceed the safe update batch.');
 const updates=[];let skipped=0;
 for(const project of eligible){const reports=reportPage.items.filter(r=>[project.id,project.dataverse_id].includes(r.project_id));if(reports.length!==1){skipped++;continue;}const delivery=deliveryPage.items.find(r=>r.project_id===project.id) || {};const changes=frameworkLiveKpiValues(reports[0],project,delivery);if(Object.keys(changes).length)updates.push({id:reports[0].id,...changes});}
 if(updates.length)await db.FrameworkProjectReport.bulkUpdate(updates);
 return {updated:updates.length,skipped};
}
export async function syncFrameworkLiveKpiProject(db,projectId) {
 if(typeof projectId!=='string' || !/^[a-f0-9]{24}$/i.test(projectId))throw new Error('Valid project required.');
 const project=await db.Project.get(projectId);return syncFrameworkLiveKpis(db,project ? [project] : []);
}
export async function frameworkLiveKpiProjects(db,cursor) {
 return db.Project.filter({procurement_route:true,status:{$ne:'inactive'}},{sort:'id',limit:25,fields:projectFields,...(cursor ? {cursor} : {})});
}