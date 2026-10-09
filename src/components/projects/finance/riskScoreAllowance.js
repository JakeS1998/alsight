// Equal contingency shares per registered risk; closed risks contribute zero.
export default function riskScoreAllowance(contingency, result) {
  if (!result) return { amount: null, fraction: null, reason: 'unavailable' };
  const totals = result.rows.reduce((totals, row) => {
    const count = Number(row.count) || 0;
    totals.total += count;
    if (row.status === 'closed') { totals.closed += count; return totals; }
    totals.active += count;
    const score = Number(row.risk_index);
    if (row.risk_index == null || !Number.isInteger(score) || score < 1 || score > 25) totals.unscored += count;
    else totals.scoreSum += Number(row.sum_risk_index) || 0;
    return totals;
  }, { total: 0, active: 0, closed: 0, unscored: 0, scoreSum: 0 });
  const reason = !totals.total ? 'no_register' : totals.unscored ? 'unscored' : contingency == null ? 'no_contingency' : null;
  const fraction = totals.total && !totals.unscored ? totals.scoreSum / (25 * totals.total) : null;
  const amount = reason == null ? Math.round(Number(contingency) * fraction * 100) / 100 : null;
  return { ...totals, reason, fraction, amount, contingency,
    remaining: amount == null ? null : Math.round((Number(contingency) - amount) * 100) / 100,
  };
}