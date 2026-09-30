import { projectCompletionDates } from './projectCompletionDates.ts';

const day = value => {
  const text = typeof value === 'string' ? value.slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text)) ? text : '';
};

// Preserve the UKLF rule: a delay of two calendar months or more is not on time.
export function completionOutcome(project) {
  const expectedDates = projectCompletionDates(project);
  const pairs = [1, 2, 3, 4, 5].map(n => [
    day(expectedDates[`riba${n}_system_date`]),
    day(n === 5 ? project.practical_completion_date : project[`riba${n}_end`]),
  ]).filter(([expected, actual]) => expected && actual);
  if (!pairs.length) return '';
  return pairs.some(([expected, actual]) => {
    const [year, month, date] = expected.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
    return Date.parse(actual) >= Date.UTC(year, month + 1, Math.min(date, lastDay));
  }) ? 'N' : 'Y';
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