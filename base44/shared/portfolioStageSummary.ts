export async function readPortfolioStages(entities, query, now, cachedRead) {
  const p5 = { $or: [{ riba5_system_date: { $gt: '', $lte: now } }, { riba4_end: { $gt: '', $lt: now } }] };
  const fields = ['riba3_end', 'riba2_end', 'riba1_end'];
  const labels = ['RIBA 5–7', 'RIBA 4', 'RIBA 3', 'RIBA 2', 'RIBA 1'];
  const [construction, design] = await Promise.all([
    cachedRead('stage:construction-v2', () => entities.Project.aggregate({ query: { $and: [query, p5] }, sum: 'estimated_value' })),
    cachedRead('stage:design-v2', () => entities.Project.aggregate({ query: { $and: [query, { $nor: [p5] }] }, groupBy: fields, sum: 'estimated_value', limit: 1000 }))
  ]);
  const stages = labels.map(stage => ({ stage, count: 0, value: 0 }));
  stages[0].count = construction.rows[0]?.count || 0;
  stages[0].value = construction.rows[0]?.sum_estimated_value || 0;
  if (design.truncated) {
    const conditions = fields.map(field => ({ [field]: { $gt: '', $lt: now } }));
    for (const [index, condition] of conditions.concat([{}]).entries()) {
      const result = await cachedRead(`stage:design-fallback:${index}`, () => entities.Project.aggregate({ query: { $and: [query, { $nor: [p5] }, condition, ...conditions.slice(0, index).map(c => ({ $nor: [c] }))] }, sum: 'estimated_value' }));
      stages[index + 1].count = result.rows[0]?.count || 0;
      stages[index + 1].value = result.rows[0]?.sum_estimated_value || 0;
    }
  } else {
    for (const row of design.rows) {
      const index = fields.findIndex(field => typeof row[field] === 'string' && row[field] > '' && row[field] < now);
      const stage = stages[index < 0 ? 4 : index + 1];
      stage.count += row.count;
      stage.value += row.sum_estimated_value || 0;
    }
  }
  return stages.reverse();
}