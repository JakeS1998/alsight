export async function uklfPortfolioSummary(source, internal = false, scope = {}) {
  const query = filter => ({ $and: [scope, filter] });
  const [total, linked, questionnaire, agreement, calloff, onTimeRecorded, onTime, budgetRecorded, toBudget, safe, commercial] = await Promise.all([
    source.count(scope), source.count(query({ project_id: { $gt: '' } })), source.count(query({ pq_date: { $gt: '' } })),
    source.count(query({ aa_signed: { $gt: '' } })), source.count(query({ calloff_date: { $gt: '' } })),
    source.count(query({ completed_on_time: { $gt: '' } })), source.count(query({ completed_on_time: 'Y' })),
    source.count(query({ completed_to_budget: { $gt: '' } })), source.count(query({ completed_to_budget: 'Y' })),
    source.count(query({ $or: [{ riddor_incidents: 0 }, { zero_riddor: 'Y' }, { zero_riddor: { $in: ['', null] } }] })),
    internal ? source.aggregate({ query: scope, sum: 'calloff_value' }) : Promise.resolve(null),
  ]);
  return { total, linked, questionnaire, agreement, calloff, outcomes: onTimeRecorded, onTime, onTimeRecorded, toBudget, budgetRecorded, safe, safetyRecorded: total, ...(internal ? { commercial: commercial?.rows?.[0] || null } : {}) };
}