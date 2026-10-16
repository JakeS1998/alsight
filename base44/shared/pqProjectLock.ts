export const pqProjectLocked=project=>!!project.created_project_id||(project.subject_type==='project'&&!!String(project.project_number||'').trim());
export function pqRecordedApproval(project){
 const date=project.pq_approval_date;
 return project.subject_type==='project'&&project.link_to_project_questionnaire&&date&&Number.isFinite(Date.parse(date))?{status:'approved',approvedAt:date,source:'Existing project PQ date'}:null;
}