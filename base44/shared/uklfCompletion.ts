import { projectCompletionDates } from './projectCompletionDates.ts';

const day = value => {
  const text = typeof value === 'string' ? value.slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text)) ? text : '';
};

// UKLF completion measure: up to six calendar days late is on time.
export function completionOutcome(project) {
  const expected=day(projectCompletionDates(project).riba5_system_date),actual=day(project.practical_completion_date);
  if(!expected || !actual)return '';
  return (Date.parse(actual)-Date.parse(expected))/86400000<=6 ? 'Y' : 'N';
}

export async function reportProject(base44, report, suppliedProjectId) {
  const projects = base44.asServiceRole.entities.Project;
  const id = report.project_id || suppliedProjectId;
  if (id) {
    const project = await projects.get(id).catch(() => null);
    if (project) return project;
  }
  const ref = String(report.framework_ref || '').replace(/^FW3\s*/i, '');
  const number = report.project_number || (/^\d+$/.test(ref) ? `PROJ${ref}` : /^PROJ\d+$/i.test(ref) ? ref : '');
  if (!number) return null;
  const rows = await projects.filter({ project_number: number }, '-created_date', 1);
  return rows[0] || null;
}