import {recordedOutcome,missing} from './frameworkWorkspaceRules.ts';
const fields=['completed_on_time','completed_to_budget','zero_riddor'];
export function completeFrameworkOutcomes(row) {
 return fields.every(field=>['Y','N'].includes(row[field]));
}
export function practicalCompletionAchieved(value) {
 const date=typeof value==='string' ? value.slice(0,10) : '';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && date<=today;
}
async function completedValues(projects,field,query) {
 const values=[];let cursor;
 do {
  const page=await projects.filter(query,{distinct:field,limit:500,...(cursor ? {cursor} : {})});
  values.push(...page.items.filter(Boolean));cursor=page.has_more ? page.next_cursor : null;
 }while(cursor);
 return values;
}
export async function frameworkDeliveryOutcome(db) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const completed={procurement_route:{$ne:false},practical_completion_date:{$gte:'0001-01-01',$lte:`${today}T23:59:59.999Z`}};
 const [native,legacy,numbers]=await Promise.all(['id','dataverse_id','project_number'].map(field=>completedValues(db.Project,field,completed)));
 const ids=[...native,...legacy],refs=[...new Set(numbers.flatMap(number=>{
  const match=/^PROJ0*(\d+)$/i.exec(number);
  return match ? [number,match[1],`FW3${match[1]}`,`FW3 ${match[1]}`,`FW4${match[1]}`,`FW4 ${match[1]}`] : [number];
 }))];
 const numberMatch={$or:[{project_number:{$in:numbers}},{$and:[missing('project_number'),{framework_ref:{$in:refs}}]}]};
 return {
  query:{$and:[recordedOutcome,{$or:[{project_id:{$in:ids}},{$and:[missing('project_id'),numberMatch]}]}]},
  matches:row=>completeFrameworkOutcomes(row) && (row.project_id ? ids.includes(row.project_id) : row.project_number ? numbers.includes(row.project_number) : refs.includes(row.framework_ref)),
 };
}