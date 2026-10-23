import {completedWarrantyStatuses} from './handoverWarranties.ts';
export async function pathwayWorkFacts(base44,project) {
 const db=base44.entities,now=new Date().toISOString(),ids=[project.id,project.dataverse_id].filter(Boolean);
 const scope={project_id:{$in:ids},status:{$ne:'inactive'}};
 const signed={$or:[{date_of_execution:{$exists:true,$nin:[null,'']}},{warranty_status:{$in:completedWarrantyStatuses}}]};
 const [total,complete,filed,overdue]=await Promise.all([
  db.Warranty.count(scope),db.Warranty.count({...scope,...signed}),
  db.Warranty.count({...scope,...signed,link_to_file:{$exists:true,$nin:[null,'']}}),
  db.Warranty.count({...scope,warranty_due:{$lt:now,$nin:[null,'']},warranty_status:{$nin:completedWarrantyStatuses},$or:[{date_of_execution:{$exists:false}},{date_of_execution:{$in:[null,'']}}]}),
 ]);
 const counts=await Promise.all(['progress','handover','post_review'].map(kind=>db.CRMActivity.count({project_id:project.id,type:'project_meeting',next_action:`bms_meeting_${kind}`,occurred_at:{$lte:now}})));
 return {warrantyTracker:{total,complete,filed,overdue},meetings:{progress:counts[0],handover:counts[1],post_review:counts[2]}};
}