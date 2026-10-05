import { base44 } from '@/api/base44Client';
import { createCRMOpportunity } from '@/components/crm/crm';
import projectTaskGuides from '@/components/alice/aliceProjectTaskGuides';
import saveAliceProjectTask from '@/components/alice/saveAliceProjectTask';

export const GUIDES = {
  ...projectTaskGuides,
  opportunity: { label: 'I have a new opportunity to log', roles: ['admin', 'director', 'bdm', 'bsm'], steps: [
    { key: 'title', question: 'What should we call this opportunity?' },
    { key: 'account_id', type: 'client', question: 'Which client is this for?' },
    { key: 'project_details', question: 'What is the opportunity about?', optional: true },
    { key: 'location', question: 'Where is it located?', optional: true },
    { key: 'budget', type: 'number', question: 'What is the estimated project value in pounds?', optional: true },
  ] },
  project: { label: 'I want to request a project', roles: ['admin', 'director', 'bdm'], steps: [
    { key: 'name', question: 'What is the project name?' },
    { key: 'client_account_id', type: 'client', question: 'Which client is the project for?', optional: true },
    { key: 'description', question: 'What work is proposed?', optional: true },
    { key: 'site_postcode', question: 'What is the site postcode?', optional: true },
    { key: 'estimated_value', type: 'number', question: 'What is the estimated value in pounds?', optional: true },
  ] },
  risk: { label: 'I need to add a project risk', roles: ['admin', 'director', 'bdm', 'bsm'], steps: [
    { key: 'project_id', type: 'project', question: 'Which project is the risk for?' },
    { key: 'title', question: 'What is the risk or issue?' },
    { key: 'probability', type: 'level', question: 'How likely is it?', optional: true },
    { key: 'impact', type: 'level', question: 'How significant would the impact be?', optional: true },
    { key: 'mitigation', question: 'How could the team manage it?', optional: true },
  ] },
  comment: { label: 'I want to add a project comment', roles: ['admin', 'director', 'bdm'], steps: [
    { key: 'project_id', type: 'project', question: 'Which project should I add the comment to?' },
    { key: 'comment', question: 'What would you like to record?' },
  ] },
};

export async function saveGuide(type, answers, user) {
  if (['action', 'decision'].includes(type)) return saveAliceProjectTask(type, answers, user);
  if (type === 'opportunity') {
    const record = await createCRMOpportunity({ title: answers.title, account_id: answers.account_id.id, project_details: answers.project_details || '', location: answers.location || '', ...(answers.budget ? { budget: Number(answers.budget) } : {}) }, user);
    return { message: `Opportunity “${record.title}” created.`, path: `/opportunities/${record.id}`, link: 'Open opportunity' };
  }
  if (type === 'project') {
    const record = await base44.entities.Project.create({ name: answers.name, description: answers.description || '', client_account_id: answers.client_account_id?.dataverse_id || answers.client_account_id?.id || null, client_name: answers.client_account_id?.name || null, estimated_value: answers.estimated_value ? Number(answers.estimated_value) : null, site_postcode: answers.site_postcode || null, bdm_aad_id: user.id, project_number: '', live_project: true, status: 'active' });
    return { message: `Project “${record.name}” created.`, path: `/projects/${record.id}`, link: 'Open project' };
  }
  if (type === 'risk') {
    const project = answers.project_id;
    await base44.entities.ProjectRisk.create({ project_id: project.id, client_account_id: project.client_account_id || null, bdm_aad_id: project.bdm_aad_id || null, title: answers.title, probability: answers.probability || '', impact: answers.impact || '', mitigation: answers.mitigation || '', status: 'open' });
    return { message: `Risk added to “${project.name}”.`, path: `/projects/${project.id}?tab=delivery`, link: 'View project risks' };
  }
  const project = await base44.entities.Project.get(answers.project_id.id);
  const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' });
  const line = `${date} · ${user.full_name || user.email}: ${answers.comment}`;
  await base44.entities.Project.update(project.id, { comments: [project.comments?.trim(), line].filter(Boolean).join('\n\n') });
  return { message: `Comment added to “${project.name}”.`, path: `/projects/${project.id}`, link: 'View project' };
}