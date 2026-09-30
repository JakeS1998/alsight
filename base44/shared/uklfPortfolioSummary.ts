export async function uklfPortfolioSummary(source, internal = false) {
  const [total, linked, questionnaire, agreement, calloff, onTimeRecorded, onTime, budgetRecorded, toBudget, safe, commercial] = await Promise.all([
    source.count({}), source.count({ project_id: { $gt: '' } }), source.count({ pq_date: { $gt: '' } }),
    source.count({ aa_signed: { $gt: '' } }), source.count({ calloff_date: { $gt: '' } }),
    source.count({ completed_on_time: { $gt: '' } }), source.count({ completed_on_time: 'Y' }),
    source.count({ completed_to_budget: { $gt: '' } }), source.count({ completed_to_budget: 'Y' }),
    source.count({ $or: [{ riddor_incidents: 0 }, { zero_riddor: 'Y' }, { zero_riddor: { $in: ['', null] } }] }),
    internal ? source.aggregate({ sum: ['calloff_value', 'completion_value'] }) : Promise.resolve(null),
  ]);
  return { total, linked, questionnaire, agreement, calloff, outcomes: onTimeRecorded, onTime, onTimeRecorded, toBudget, budgetRecorded, safe, safetyRecorded: total, ...(internal ? { commercial: commercial?.rows?.[0] || null } : {}) };
}