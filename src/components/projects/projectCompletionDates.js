// Imported expected dates are authoritative; only blank dates are calculated.
export function projectCompletionDates(project) {
  const dates = {};
  let previous = project.aa_executed_date;
  for (let stage = 1; stage <= 5; stage++) {
    const key = `riba${stage}_system_date`;
    const actual = stage === 5 ? project.practical_completion_date : project[`riba${stage}_end`];
    const weeks = stage === 5 ? project.construction_term_weeks : project[`riba${stage}_term_weeks`];
    let expected = project[key];
    if ((!expected || !String(expected).trim()) && previous && weeks !== null && weeks !== undefined && String(weeks).trim() !== '' && Number.isFinite(Number(weeks)) && Number(weeks) >= 0) {
      const start = Date.parse(String(previous).slice(0, 10));
      const end = start + Number(weeks) * 7 * 86400000;
      if (Number.isFinite(end) && Math.abs(end) <= 8640000000000000) expected = new Date(end).toISOString().slice(0, 10);
    }
    dates[key] = expected || null;
    previous = actual && Number.isFinite(Date.parse(actual)) ? actual : dates[key];
  }
  return dates;
}