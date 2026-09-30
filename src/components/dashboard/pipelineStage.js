import { isPipelineProject } from '@/components/dashboard/portfolioMetrics';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';

export const STAGES = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5–7'];

export function projectStage(project) {
  if (!isPipelineProject(project)) return null;
  const now = new Date();
  if ((project.riba5_system_date && new Date(project.riba5_system_date) <= now) || (project.riba4_end && new Date(project.riba4_end) < now)) return 'RIBA 5–7';
  if (project.riba3_end && new Date(project.riba3_end) < now) return 'RIBA 4';
  if (project.riba2_end && new Date(project.riba2_end) < now) return 'RIBA 3';
  if (project.riba1_end && new Date(project.riba1_end) < now) return 'RIBA 2';
  return 'RIBA 1';
}

export function nextStageDate(project, stage) {
  const field = { 'RIBA 1': 'riba1_end', 'RIBA 2': 'riba2_end', 'RIBA 3': 'riba3_end', 'RIBA 4': 'riba4_end', 'RIBA 5–7': 'practical_completion_date' }[stage];
  const expectedField = { 'RIBA 1': 'riba1_system_date', 'RIBA 2': 'riba2_system_date', 'RIBA 3': 'riba3_system_date', 'RIBA 4': 'riba4_system_date', 'RIBA 5–7': 'riba5_system_date' }[stage];
  return project[field] || projectCompletionDates(project)[expectedField];
}