import { forecastInputs } from './financeForecastInputs.ts';
import { forecastProject, monthlyShare, monthKey } from './financeForecastCalculation.ts';
export async function projectPOForecast(db, state, projectId) {
 const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for await (const source of forecastInputs({entities:db}, state, '', projectId)) {
  const project = forecastProject(source, today, Boolean(state?.active_generation));
  if (project.reason || project.poRemaining == null) return {today, rows:[], note:project.reason || project.poNote, available:false};
  if (project.months > 1200) return {today, rows:[], note:'Programme exceeds the forecast reporting limit.', available:false};
  const rows = Array.from({length:project.months}, (_,i) => {
   const index=project.firstMonth+i, month=monthKey(index);
   const monthEnd=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
   return {date:monthEnd < project.end ? monthEnd : project.end, amount:monthlyShare(project.poRemaining,project,index)};
  });
  return {today, rows, available:true, note:`${project.poNote}. Additional PO estimates are spread evenly to ${project.end}; they are not a supplier payment schedule.`};
 }
 return {today, rows:[], available:false, note:'No positive project value available for forecasting.'};
}