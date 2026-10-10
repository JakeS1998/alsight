import { forecastInputs } from './financeForecastInputs.ts';
import { forecastProject, monthlyShare, monthKey } from './financeForecastCalculation.ts';
export async function projectPOForecast(db, state, selectedProject) {
 const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for await (const source of forecastInputs({entities:db}, state, '', selectedProject)) {
  const project = forecastProject(source, today, Boolean(state?.active_generation));
  const breakdown={supplierBudget:project.supplierBudget??null,committed:project.poCommitted??null,remaining:project.poRemaining==null?null:project.poRemaining/100,budgetExcess:project.poBudgetExcess??null,months:project.months??null,end:project.end,costSource:project.costSource};
  if (project.reason || project.poRemaining == null) return {today, ...breakdown, rows:[], note:project.reason || project.poNote, available:false};
  if (project.months > 1200) return {today, rows:[], note:'Programme exceeds the forecast reporting limit.', available:false};
  const rows = Array.from({length:project.months}, (_,i) => {
   const index=project.firstMonth+i, month=monthKey(index);
   const monthEnd=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
   return {date:monthEnd < project.end ? monthEnd : project.end, amount:monthlyShare(project.poRemaining,project,index)};
  });
  return {today, ...breakdown, rows, monthlyAverage:project.poRemaining/100/project.months, available:true, note:`${project.poNote}. Remaining supplier budget is divided across ${project.months} programme months to ${project.end}; this estimates additional POs, not supplier payment dates.`};
 }
 return {today, rows:[], available:false, note:'No positive project value available for forecasting.'};
}