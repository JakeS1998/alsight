import {derivedKpis,frameworkKpiCompletion,validDate} from './frameworkKpiRules.ts';
import {projectCompletionDates} from './projectCompletionDates.ts';
const day=value=>{const date=typeof value==='string' ? value.slice(0,10) : '';return validDate(date) ? date : '';};
const empty=field=>['contract_sum','completion_delay_days','budget_variance_pct'].includes(field) ? null : '';
export function frameworkLiveKpiValues(report,project,delivery={}) {
 const previous=report.live_kpi_state || {},base={...report},fallback={},applied={};
 // Restore recorded values before overlaying current project data; removals must not leave stale live outcomes.
 for(const [field,value] of Object.entries(previous.applied || {}))if(report[field]===value)base[field]=previous.fallback?.[field] ?? empty(field);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const inputs={},actual=day(delivery.pc_achieved) || day(project.practical_completion_date);
 const expected=day(delivery.lad_completion_date) || day(delivery.original_pc) || day(projectCompletionDates(project).riba5_system_date);
 if(expected)inputs.contractual_completion_date=expected;
 if(actual)inputs.actual_completion_date=actual<=today ? actual : '';
 if(Number.isFinite(delivery.contract_sum) && delivery.contract_sum>=0)inputs.contract_sum=delivery.contract_sum;
 const merged={...base,...inputs},derived=derivedKpis(merged);
 const own=(field,value)=>{fallback[field]=base[field] ?? empty(field);applied[field]=value;};
 for(const [field,value] of Object.entries(inputs))own(field,value);
 if('contractual_completion_date' in inputs || 'actual_completion_date' in inputs)for(const field of ['completion_delay_days','time_category','completed_on_time'])own(field,derived[field]);
 if('contract_sum' in inputs)for(const field of ['budget_variance_pct','cost_category','completed_to_budget'])own(field,derived[field]);
 // Final completion cost remains explicitly recorded: interim valuations are never treated as final accounts.
 const candidate={...base,...inputs,...derived,live_kpi_state:{fallback,applied}};
 candidate.kpis_complete=frameworkKpiCompletion(candidate).complete;
 return Object.fromEntries(Object.entries(candidate).filter(([field,value])=>field!=='id' && (field==='live_kpi_state' ? JSON.stringify(value)!==JSON.stringify(report[field] || {fallback:{},applied:{}}) : value!==report[field])));
}