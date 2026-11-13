function recordedDate(value) {
  const date = typeof value === 'string' ? value.slice(0, 10) : '';
  const time = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(date) : NaN;
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date ? date : null;
}

export default function projectBuildStartDate(project, dmas = []) {
  // Initial execution is the build gateway; later or superseded DMA versions do not reset it.
  const executionDates = dmas.filter(dma => dma.executed === 'yes')
    .map(dma => recordedDate(dma.date_of_execution)).filter(Boolean).sort();
  const execution = executionDates[0];
  if (!execution) return null;
  const designCompletion = recordedDate(project.riba4_end);
  return designCompletion && designCompletion > execution ? designCompletion : execution;
}