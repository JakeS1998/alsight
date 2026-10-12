import { forecastInputs } from './financeForecastInputs.ts';
import { forecastProject, monthlyShare, monthKey } from './financeForecastCalculation.ts';
export async function projectPOForecast(db, state, selectedProject, transactionSpend=null) {
 const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for await (const source of forecastInputs({entities:db}, state, '', selectedProject)) {
  const transactions=transactionSpend!==null;
  if(transactions){
   const usable=Number.isFinite(transactionSpend.amount)&&!transactionSpend.missingValues;
   source.actuals=[...source.actuals.filter(row=>row.kind!=='purchase_orders'),{kind:'purchase_orders',has_amount:usable,sum_amount:usable?transactionSpend.amount:0,count:usable?1:Math.max(1,transactionSpend.missingValues||0)}];
   source.poFallback=false;
  }
  const project = forecastProject(source, today, Boolean(state?.active_generation));
  if(transactions&&!project.reason)project.poNote=project.poMissingValues?'Recorded supplier transaction amounts are incomplete':project.poCommitted==null?'Transaction spend unavailable: no confirmed finance link':`${project.costSource}, less recorded supplier transaction spend (net of credits, including unpaid invoices; not confirmed cash paid)${project.poBudgetExcess>0?'. Recorded supplier transaction spend exceeds the supplier budget':project.poRemaining===0?'. No remaining supplier budget':''}`;
  const breakdown={supplierBudget:project.supplierBudget??null,committed:project.poCommitted??null,remaining:project.poRemaining==null?null:project.poRemaining/100,budgetExcess:project.poBudgetExcess??null,months:project.months??null,end:project.end,costSource:project.costSource,spendBasis:transactions?'transactions':'purchase_orders'};
  if (project.reason || project.poRemaining == null) return {today, ...breakdown, rows:[], note:project.reason || project.poNote, available:false};
  if (project.months > 1200) return {today, rows:[], note:'Programme exceeds the forecast reporting limit.', available:false};
  const rows = Array.from({length:project.months}, (_,i) => {
   const index=project.firstMonth+i, month=monthKey(index);
   const monthEnd=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
   return {date:monthEnd < project.end ? monthEnd : project.end, amount:monthlyShare(project.poRemaining,project,index)};
  });
  return {today, ...breakdown, rows, monthlyAverage:project.poRemaining/100/project.months, available:true, note:`${project.poNote}. Remaining ${transactions?'supplier spend':'PO'} forecast value is divided equally across ${project.months} programme months to ${project.end}; this estimates ${transactions?'additional supplier costs':'additional POs'}, not supplier payment dates.`};
 }
 return {today, rows:[], available:false, note:'No positive project value available for forecasting.'};
}