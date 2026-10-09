export async function projectValueSyncUpdates(base44,updates) {
 const existing=new Map();let cursor;
 do {
  const page=await base44.entities.Project.filter({dataverse_id:{$in:updates.map(row=>row.dataverse_id)}},{limit:50,cursor,fields:['dataverse_id','estimated_value','submitted_proposal_value']});
  for(const project of page.items)existing.set(project.dataverse_id,project);
  cursor=page.has_more ? page.next_cursor : null;
 }while(cursor);
 return updates.map(update=>{const project=existing.get(update.dataverse_id),estimate=Object.prototype.hasOwnProperty.call(update,'estimated_value') ? update.estimated_value : project?.estimated_value;return {...update,full_value:project?.submitted_proposal_value ?? (Number(estimate) || 0)};});
}