import { base44 } from '@/api/base44Client';
export default async function saveAliceProjectTask(type, answers, user) {
  const project = await base44.entities.Project.get(answers.project_id.id);
  const scope = { project_id: project.id, client_account_id: project.client_account_id || null, bdm_aad_id: project.bdm_aad_id || null };
  if (type === 'action') {
    await base44.entities.ProjectAction.create({ ...scope, action: answers.action.trim(), owner: answers.owner?.name || '', owner_id: answers.owner?.id || '', ...(answers.due_date ? { due_date: answers.due_date } : {}), priority: answers.priority || 'medium', status: 'open', comments: answers.comments || '' });
    window.dispatchEvent(new Event('alsight-tasks-changed'));
    return { message: `Action saved to “${project.name}”.`, path: `/projects/${project.id}?tab=delivery&stage=6`, link: 'View action register' };
  }
  await base44.entities.ProjectDecision.create({ ...scope, decision_title: answers.decision_title.trim(), decision: answers.decision || '', requested_by: user.full_name || user.email, date_requested: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }), decision_maker: answers.decision_maker || '', status: answers.status, ...(answers.required_by ? { required_by: answers.required_by } : {}), ...(answers.date_agreed ? { date_agreed: answers.date_agreed } : {}), financial_adjustment: Number(answers.financial_adjustment || 0), financial_impact: answers.financial_impact || '', programme_impact: answers.programme_impact || '' });
  return { message: `Decision saved to “${project.name}”.`, path: `/projects/${project.id}?tab=delivery&stage=7`, link: 'View decision register' };
}