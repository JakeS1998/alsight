export const workspaceFields=['framework_ref','project_id','project_number','site','client','pq_date','pq_status','aa_sent','aa_signed','calloff_date','completed_on_time','completed_to_budget','zero_riddor','riddor_incidents','apprenticeships','created_date','updated_date'];
export const recordedOutcome={$or:['completed_on_time','completed_to_budget','zero_riddor'].map(field=>({[field]:{$in:['Y','N']}}))};
export const outcomeReview={$or:[{completed_on_time:'N'},{completed_to_budget:'N'},{zero_riddor:'N'},{riddor_incidents:{$gt:0}}]};
export const missing=field=>({$or:[{[field]:{$exists:false}},{[field]:{$in:['',null]}}]});
export const outcomeMissing={$nor:[recordedOutcome]};
export function workspaceQuery(scope,body) {
 const f=body.filters || {},parts=[scope],term=String(body.term || '').trim().slice(0,80).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 if(term)parts.push({$or:['project_number','framework_ref','site','client'].map(field=>({[field]:{$regex:term.replace(/^PROJ0*/i,''),$options:'i'}}))});
 if(['pq_date','aa_signed','calloff_date'].includes(f.stage))parts.push({[f.stage]:{$gt:''}});
 if(f.stage==='outcome')parts.push(recordedOutcome);
 if(f.linked==='linked')parts.push({project_id:{$gt:''}});if(f.linked==='unlinked')parts.push(missing('project_id'));
 if(f.client)parts.push({client:String(f.client).slice(0,200)});
 if(f.attention==='agreements')parts.push(missing('aa_signed'));
 if(f.attention==='outstanding')parts.push({$and:[{calloff_date:{$gt:''}},outcomeMissing]});
 if(f.outcome==='missing')parts.push(outcomeMissing);if(f.outcome==='recorded')parts.push(recordedOutcome);if(f.outcome==='review')parts.push(outcomeReview);
 if(f.outcome==='on_time')parts.push({completed_on_time:'Y'});if(f.outcome==='delayed')parts.push({completed_on_time:'N'});if(f.outcome==='to_budget')parts.push({completed_to_budget:'Y'});
 return {$and:parts};
}
export function safeWorkspaceRow(record,project) {
 const row=Object.fromEntries(workspaceFields.filter(key=>key!=='project_id').map(key=>[key,record[key] ?? null]));
 return {id:record.id,...row,linked:!!record.project_id,project_id:project?.id || null,location:project && Number.isFinite(project.latitude) && Number.isFinite(project.longitude) && Math.abs(project.latitude)<=90 && Math.abs(project.longitude)<=180 && (project.latitude || project.longitude) ? {latitude:project.latitude,longitude:project.longitude} : null};
}