export const kpiYesNo=['management_information_on_time','supplier_insurance_confirmed','supplier_questionnaire_current','schedule14_insurance_confirmed'];
export const kpiMoney=['local_spend','local_spend_target','welsh_spend','welsh_spend_target','contract_sum','completion_value','calloff_value','access_fee'];
export const kpiCounts=['school_visits','school_visits_target','apprenticeships','apprenticeships_target','consultation_events','consultation_events_target','jobs_created','jobs_created_target','riddor_incidents','riddor_reporting_year'];
export const kpiText=['pq_date','aa_signed','calloff_date','contractual_completion_date','actual_completion_date','local_spend_postcodes','welsh_spend_postcodes'];
export const kpiReadFields=[...kpiYesNo,...kpiMoney,...kpiCounts,...kpiText,'time_category','cost_category','completion_delay_days','budget_variance_pct','population_impact','population_source_url','population_source_year','population_source_note','population_checked_at','kpis_complete'];
export const validDate=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
export function derivedKpis(row) {
 const dated=validDate(row.contractual_completion_date) && validDate(row.actual_completion_date);
 const delay=dated ? Math.round((Date.parse(row.actual_completion_date)-Date.parse(row.contractual_completion_date))/86400000) : null;
 const variance=Number.isFinite(row.contract_sum) && row.contract_sum>0 && Number.isFinite(row.completion_value) ? (row.completion_value-row.contract_sum)/row.contract_sum*100 : null;
 return {completion_delay_days:delay,time_category:delay===null ? '' : delay<=6 ? 'on_time' : delay<=28 ? 'late_7_28' : 'late_over_28',completed_on_time:delay===null ? row.completed_on_time || '' : delay<=6 ? 'Y' : 'N',budget_variance_pct:variance===null ? null : Math.round(variance*100)/100,cost_category:variance===null ? '' : variance<=0 ? 'within_budget' : variance<=10 ? 'over_within_10' : 'over_10',completed_to_budget:variance===null ? row.completed_to_budget || '' : variance<=0 ? 'Y' : 'N'};
}
export function frameworkKpiCompletion(row) {
 if(!row)return {complete:false,missing:['Linked UKLF record']};
 const missing=[];
 // Framework-wide ALS reviews are maintained separately and never gate a project's completion.
 for(const key of [...kpiMoney,...kpiCounts])if(!Number.isFinite(row[key]) || row[key]<0)missing.push(key==='access_fee' ? 'UKLF fee' : key.replaceAll('_',' '));
 if(!(row.contract_sum>0))missing.push('Positive contract sum');
 for(const key of ['pq_date','aa_signed','calloff_date','contractual_completion_date','actual_completion_date'])if(!validDate(row[key]))missing.push(key.replaceAll('_',' '));
 if(validDate(row.actual_completion_date) && row.actual_completion_date>new Date().toISOString().slice(0,10))missing.push('Actual completion cannot be in the future');
 for(const key of ['local_spend_postcodes','welsh_spend_postcodes'])if(!String(row[key] || '').trim())missing.push(key.replaceAll('_',' '));
 if(!Number.isInteger(row.population_impact) || !row.population_source_url || !row.population_source_year)missing.push('ALICE Population Impact (10-mile radius)');
 return {complete:missing.length===0,missing};
}