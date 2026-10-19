const ignored = new Set('a an the and or at in on to of for with from by as is are was were be been being has have had do does did can could would should will may might i me my we our you your it its this that these those please tell show find search look up about explain describe give get know more detail details information info summary summarise summarize what which where when who how why project projects record records recorded current currently latest recent status update updates happening going doing any all accessible visible context'.split(' '));
const fields = ['name', 'project_number', 'client_name', 'site_postcode'];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export default async function adaptiveProjectSearch(base44, question) {
 const terms = [...new Set((question.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => word.length > 1 && !ignored.has(word)))].slice(0, 6);
 if (!terms.length) return { records: [], searched: false, more: false };
 const conditions = terms.map(term => ({ $or: fields.map(field => ({ [field]: { $regex: escape(term), $options: 'i' } })) }));
 const page = await base44.entities.Project.filter(conditions.length === 1 ? conditions[0] : { $and: conditions }, {
  sort: '-updated_date', limit: 5,
  fields: ['name', 'project_number', 'client_name', 'status', 'live_project', 'full_value', 'estimated_value', 'description', 'why_this_matters', 'site_postcode', 'practical_completion_date', 'aa_executed_date', 'pq_approval_date', 'updated_date']
 });
 return { searched: true, more: !!page.has_more, records: page.items.map(project => ({
  title: project.name,
  detail: JSON.stringify({ source: 'Accessible Project register search', reference: project.project_number, client: project.client_name, recordStatus: project.status, liveProject: project.live_project, recordedProjectValueGBP: project.full_value ?? project.estimated_value, postcode: project.site_postcode, description: project.description?.slice(0, 600), purpose: project.why_this_matters?.slice(0, 1000), recordedPracticalCompletionDate: project.practical_completion_date, accessAgreementExecutedDate: project.aa_executed_date, questionnaireApprovalDate: project.pq_approval_date, updated: project.updated_date }).slice(0, 2600),
  due: '', level: 'Project register source', to: `/projects/${project.id}`
 })) };
}