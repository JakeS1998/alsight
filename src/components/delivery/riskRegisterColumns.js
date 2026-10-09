export function riskIndex(row) {
  return row.probability_rating && row.impact_rating ? Number(row.probability_rating) * Number(row.impact_rating) : null;
}
const ratings = [1, 2, 3, 4, 5].map(n => ({ value: String(n), label: String(n) }));
export const RISK_COLUMNS = [
  { key: 'reference', label: 'Ref', type: 'text', required: true },
  { key: 'title', label: 'Description', type: 'textarea', required: true, fullWidth: true },
  { key: 'cause', label: 'Cause', type: 'textarea', fullWidth: true },
  { key: 'status', label: 'Status', type: 'select', options: [{ value: 'open', label: 'Active' }, { value: 'closed', label: 'Closed / eliminated' }], required: true },
  { key: 'impact_description', label: 'Impact', type: 'textarea', fullWidth: true },
  { key: 'probability_rating', label: 'Probability rating', type: 'select', options: ratings, required: true },
  { key: 'impact_rating', label: 'Impact rating', type: 'select', options: ratings, required: true },
  { key: 'risk_index', label: 'Risk index', type: 'calculated', calculate: riskIndex },
  { key: 'mitigation', label: 'Control strategy', type: 'textarea', fullWidth: true },
  { key: 'owner', label: 'Owner', type: 'select', options: [{ value: 'Client', label: 'Client' }, { value: 'Contractor', label: 'Contractor' }], required: true },
  { key: 'comments', label: 'Comments', type: 'textarea', fullWidth: true },
];
export function prepareRisk(payload) {
  if (!['Client', 'Contractor'].includes(payload.owner)) throw new Error('Assign each risk to Client or Contractor.');
  const ratings = [Number(payload.probability_rating), Number(payload.impact_rating)];
  if (ratings.some(n => !Number.isInteger(n) || n < 1 || n > 5)) throw new Error('Ratings must be between 1 and 5.');
  const { anticipated_cost, weighted_cost, ...risk } = payload;
  return { ...risk, probability_rating: ratings[0], impact_rating: ratings[1], risk_index: riskIndex(payload) };
}