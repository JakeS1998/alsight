import {recordedOutcome,outcomeMissing} from './frameworkWorkspaceRules.ts';
import {frameworkOutcomeSummary} from './frameworkOutcomeSummary.ts';
export async function frameworkWorkspaceSummary(source,scope,internal,days=30) {
 const q=extra=>({$and:[scope,extra]}),start=new Date(Date.now()-days*86400000).toISOString(),date=start.slice(0,10),today=new Date().toISOString().slice(0,10);
 const queries={linked:q({project_id:{$gt:''}}),questionnaire:q({pq_date:{$gt:''}}),agreement:q({aa_signed:{$gt:''}}),calloff:q({calloff_date:{$gt:''}}),outstanding:q({$and:[{calloff_date:{$gt:''}},outcomeMissing]}),added:q({pq_date:{$gte:date,$lte:today}}),signed:q({aa_signed:{$gte:date,$lte:today}}),calledOff:q({calloff_date:{$gte:date,$lte:today}}),outcomeUpdated:q({$and:[recordedOutcome,{updated_date:{$gte:start}},{created_date:{$lt:start}}]})};
 // One grouped calculation replaces the separate outcome and commercial reads.
 const summary=await frameworkOutcomeSummary(source,scope,internal);
 const entries=Object.entries(queries);
 for(let index=0;index<entries.length;index+=2) {
  const batch=await Promise.all(entries.slice(index,index+2).map(async([key,query])=>[key,await source.count(query)]));
  for(const [key,value] of batch)summary[key]=value;
 }
 summary.unlinked=summary.total-summary.linked;
 summary.missingAgreements=summary.total-summary.agreement;
 return {...summary,periodDays:days,asOf:new Date().toISOString(),activityNote:'Questionnaire activity uses the recorded PQ date, not the date added to the system; missing or future PQ dates are excluded. Agreements and call-offs use recorded milestone dates. Outcome updates are not necessarily newly completed projects.'};
}