const DAY = 86400000;
export const LAD_PERIODS = { day: 'day', week: 'week', month: 'month', year: 'year' };
export function getLADStages(delivery) {
  if (Array.isArray(delivery.lad_stages)) return delivery.lad_stages;
  return delivery.lad_rate === '' || delivery.lad_rate == null ? [] : [{ basis: 'amount', value: delivery.lad_rate, period: delivery.lad_rate_period || 'week', periods: null }];
}
export function ladStageError(stages) {
  if (stages.length > 10) return 'Use no more than 10 LAD stages.';
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i], value = Number(stage.value), duration = stage.periods;
    if (!['amount', 'percentage'].includes(stage.basis) || !Object.hasOwn(LAD_PERIODS, stage.period)) return `Select a valid basis and frequency for LAD stage ${i + 1}.`;
    if (stage.value === '' || stage.value == null || !Number.isFinite(value) || value < 0 || (stage.basis === 'percentage' && value > 100)) return `Enter a valid ${stage.basis === 'percentage' ? 'percentage between 0 and 100' : 'non-negative amount'} for LAD stage ${i + 1}.`;
    if (duration === '' || duration == null) {
      if (i !== stages.length - 1) return `Set a duration for LAD stage ${i + 1} before adding a later stage.`;
    } else if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 10000) return `Enter 1–10,000 whole periods for LAD stage ${i + 1}.`;
  }
  return '';
}
export const normalizedLADStages = stages => stages.map(stage => ({ basis: stage.basis, value: Number(stage.value), period: stage.period, periods: stage.periods === '' || stage.periods == null ? null : Number(stage.periods) }));
function periodEnd(anchor, period, count) {
  if (period === 'day' || period === 'week') return anchor + count * DAY * (period === 'week' ? 7 : 1);
  const original = new Date(anchor), months = count * (period === 'year' ? 12 : 1);
  const target = new Date(Date.UTC(original.getUTCFullYear(), original.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(original.getUTCDate(), lastDay));
  return target.getTime();
}
function startedPeriods(anchor, finish, period) {
  if (finish <= anchor) return 0;
  if (period === 'day' || period === 'week') return Math.ceil((finish - anchor) / DAY / (period === 'week' ? 7 : 1));
  const start = new Date(anchor), end = new Date(finish);
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  const whole = Math.floor(months / (period === 'year' ? 12 : 1));
  return whole + (periodEnd(anchor, period, whole) < finish ? 1 : 0);
}
export function calculateLADSchedule(delivery, baseline, finish) {
  const raw = getLADStages(delivery), invalid = ladStageError(raw);
  if (invalid) return { amount: null, breakdown: [], reason: invalid };
  if (!raw.length || !baseline || !finish) return { amount: null, breakdown: [], reason: 'Enter LAD stages and valid completion dates to estimate exposure.' };
  const stages = normalizedLADStages(raw), contractSum = delivery.contract_sum === '' || delivery.contract_sum == null ? null : Number(delivery.contract_sum);
  if (stages.some(stage => stage.basis === 'percentage') && (contractSum == null || !Number.isFinite(contractSum) || contractSum < 0)) return { amount: null, breakdown: [], reason: 'A contractor contract sum is needed to calculate percentage-based LADs.' };
  let anchor = Date.parse(`${baseline}T00:00:00Z`), end = Date.parse(`${finish}T00:00:00Z`), amount = 0;
  const breakdown = [];
  for (const [index, stage] of stages.entries()) {
    if (end <= anchor) break;
    const boundary = stage.periods == null ? end : periodEnd(anchor, stage.period, stage.periods);
    const periods = startedPeriods(anchor, Math.min(end, boundary), stage.period);
    const rate = Math.round((stage.basis === 'percentage' ? contractSum * stage.value / 100 : stage.value) * 100) / 100;
    const charge = Math.round(periods * rate * 100) / 100;
    amount += charge;
    breakdown.push({ index, periods, rate, amount: charge, period: stage.period });
    anchor = boundary;
  }
  return { amount: Math.round(amount * 100) / 100, breakdown, reason: '' };
}