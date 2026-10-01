import { formatDate } from '@/lib/portal';
export function visitSnapshot(project, delivery, documents) {
  return { at: new Date().toISOString(), fields: { forecast_pc: delivery.forecast_pc || '', original_pc: delivery.original_pc || '', practical_completion_date: project.practical_completion_date || '' }, documents: Object.fromEntries(documents.map(d => [d.id, d.executed || 'no'])) };
}
export function materialProjectChanges(previous, current, project, documents) {
  const to = `/projects/${project.id}?tab=delivery`;
  const events = [];
  if (previous) {
    for (const [key, label] of [['forecast_pc', 'Forecast Practical Completion'], ['original_pc', 'Original Practical Completion'], ['practical_completion_date', 'Actual Practical Completion']]) {
      if (previous.fields[key] !== current.fields[key]) events.push({ text: `${label} changed from ${previous.fields[key] ? formatDate(previous.fields[key]) : 'not recorded'} to ${current.fields[key] ? formatDate(current.fields[key]) : 'not recorded'}.`, to });
    }
    documents.forEach(d => { const old = previous.documents[d.id]; const value = current.documents[d.id]; if (old !== undefined && old !== value && (['yes', 'po'].includes(old) || ['yes', 'po'].includes(value))) events.push({ text: `${d.document_id || 'Agreement'} execution status changed from ${old === 'yes' ? 'Executed' : old === 'po' ? 'PO issued' : 'Not executed'} to ${value === 'yes' ? 'Executed' : value === 'po' ? 'PO issued' : 'Not executed'}.`, to: `/projects/${project.id}?tab=drafting` }); });
  } else {
    const cutoff = Date.now() - 30 * 86400000;
    documents.forEach(d => { const date = Date.parse(d.date_of_execution); if (date >= cutoff && date <= Date.now()) events.push({ text: `${d.document_id || 'Agreement'} has an execution date of ${formatDate(d.date_of_execution)}.`, to: `/projects/${project.id}?tab=drafting` }); });
  }
  return events;
}