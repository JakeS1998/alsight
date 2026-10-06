import {recordedOutcome,outcomeReview,outcomeMissing,missing} from './frameworkWorkspaceRules.ts';
export async function frameworkWorkspaceSummary(source,scope,internal,days=30) {
 const q=extra=>({$and:[scope,extra]}),start=new Date(Date.now()-days*86400000).toISOString(),date=start.slice(0,10),today=new Date().toISOString().slice(0,10);
 const queries={total:scope,linked:q({project_id:{$gt:''}}),questionnaire:q({pq_date:{$gt:''}}),agreement:q({aa_signed:{$gt:''}}),calloff:q({calloff_date:{$gt:''}}),outcomes:q(recordedOutcome),unlinked:q(missing('project_id')),missingAgreements:q(missing('aa_signed')),outstanding:q({$and:[{calloff_date:{$gt:''}},outcomeMissing]}),review:q(outcomeReview),onTime:q({completed_on_time:'Y'}),onTimeRecorded:q({completed_on_time:{$in:['Y','N']}}),toBudget:q({completed_to_budget:'Y'}),budgetRecorded:q({completed_to_budget:{$in:['Y','N']}}),safe:q({$and:[recordedOutcome,{zero_riddor:'Y'}]}),safetyRecorded:q({$and:[recordedOutcome,{zero_riddor:{$in:['Y','N']}}]}),added:q({pq_date:{$gte:date,$lte:today}}),signed:q({aa_signed:{$gte:date,$lte:today}}),calledOff:q({calloff_date:{$gte:date,$lte:today}}),outcomeUpdated:q({$and:[recordedOutcome,{updated_date:{$gte:start}},{created_date:{$lt:start}}]})};
 // Avoid a burst of twenty simultaneous count requests on every workspace load.
 const summary={};
 const entries=Object.entries(queries);
 for(let index=0;index<entries.length;index+=2) {
  const batch=await Promise.all(entries.slice(index,index+2).map(async([key,query])=>[key,await source.count(query)]));
  for(const [key,value] of batch)summary[key]=value;
 }
 if(internal){const value=await source.aggregate({query:scope,sum:['calloff_value','access_fee']});summary.totalCallOffValue=value.rows?.[0]?.sum_calloff_value ?? 0;summary.totalUKLFFees=value.rows?.[0]?.sum_access_fee ?? 0;}
 return {...summary,periodDays:days,asOf:new Date().toISOString(),activityNote:'Questionnaire activity uses the recorded PQ date, not the date added to the system; missing or future PQ dates are excluded. Agreements and call-offs use recorded milestone dates. Outcome updates are not necessarily newly completed projects.'};
}