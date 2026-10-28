import { flowRequest } from './dataverseFlowApi.ts';
const entitySets = {email:'emails',appointment:'appointments',phonecall:'phonecalls',task:'tasks'};
export async function networxStatuses(context, rows) {
  // ActivityPointer has generic statuses: a native email status must come from Email,
  // otherwise values such as Received can incorrectly display as Scheduled.
  const groups = Object.entries(entitySets).map(([kind,entitySet])=>({kind,entitySet,ids:rows.filter(row=>row.kind===kind).map(row=>row.id)})).filter(group=>group.ids.length);
  const pages = await Promise.all(groups.map(group=>{
    const query = new URLSearchParams({'$select':'activityid,statuscode', '$filter':group.ids.map(id=>`activityid eq ${id}`).join(' or '), '$top':String(group.ids.length)});
    return flowRequest(context.environment,context.token,`${group.entitySet}?${query}`,{headers:{Prefer:'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});
  }));
  const labels = new Map(pages.flatMap(page=>(page.value || []).map(row=>[row.activityid,row['statuscode@OData.Community.Display.V1.FormattedValue'] || ''])));
  return rows.map(row=>row.kind==='annotation' ? row : {...row,status:labels.get(row.id) || ''});
}