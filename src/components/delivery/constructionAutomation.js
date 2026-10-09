import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import { calculateLADSchedule, getLADStages, ladStageError, normalizedLADStages } from '@/components/delivery/ladSchedule';
const day = value => {
  const text = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text)) ? text : '';
};
const timestamp = value => Date.parse(`${value}T00:00:00Z`);
export function constructionAutomation(project, delivery, today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())) {
  const dates = projectCompletionDates(project);
  const start = day(project.riba4_end) || day(dates.riba4_system_date);
  const expected = day(dates.riba5_system_date);
  const actual = day(project.practical_completion_date);
  const forecast = actual || expected;
  const duration = start && expected ? timestamp(expected) - timestamp(start) : 0;
  const pct = duration > 0 ? Math.round(Math.min(100, Math.max(0, (timestamp(today) - timestamp(start)) / duration * 100)) * 10) / 10 : null;
  const effectiveForecast = delivery.forecast_pc_override ? day(delivery.forecast_pc) : forecast;
  const baseline = day(delivery.lad_completion_date) || day(delivery.original_pc) || expected;
  const achieved = day(delivery.pc_achieved) || (actual && actual <= today ? actual : '');
  const finish = achieved || (effectiveForecast ? (effectiveForecast > today ? effectiveForecast : today) : '');
  const delayDays = baseline && finish ? Math.max(0, Math.round((timestamp(finish) - timestamp(baseline)) / 86400000)) : null;
  const schedule = calculateLADSchedule(delivery, baseline, finish);
  const amount = schedule.amount;
  const exposure = amount == null ? '' : amount > 0 ? 'Potential' : 'None';
  return { start, expected, baseline, delayDays, amount, ladBreakdown: schedule.breakdown, ladReason: schedule.reason,
    pct_programme: delivery.pct_programme_override ? delivery.pct_programme : pct,
    forecast_pc: effectiveForecast,
    lad_exposure: delivery.lad_exposure_override ? delivery.lad_exposure : exposure,
  };
}
export function savedConstructionValues(project, delivery) {
  const stages = getLADStages(delivery);
  const stageError = ladStageError(stages);
  if (stageError) throw new Error(stageError);
  if (delivery.pct_programme_override && delivery.pct_programme !== '' && (!Number.isFinite(Number(delivery.pct_programme)) || Number(delivery.pct_programme) < 0 || Number(delivery.pct_programme) > 100)) throw new Error('Programme complete must be between 0 and 100.');
  const values = constructionAutomation(project, delivery);
  return { ...Object.fromEntries(['pct_programme', 'forecast_pc', 'lad_exposure'].map(key => [key, values[key]])), lad_exposure_amount: values.amount, lad_stages: normalizedLADStages(stages) };
}