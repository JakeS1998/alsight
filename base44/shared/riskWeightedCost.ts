export function weightedRiskPence(row) {
  const ratings = [Number(row.probability_rating), Number(row.impact_rating)];
  const cost = row.anticipated_cost;
  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0 || ratings.some(n => !Number.isInteger(n) || n < 1 || n > 5)) return null;
  return Math.round(Math.round(cost * 100) * ratings[0] * ratings[1] / 25);
}