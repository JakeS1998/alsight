export async function capacityVisibleIds(db,entity,ids) {
  if(!ids.length)return new Set();
  // Always use the caller's token for permission checks, never the aggregate client.
  const result=await db[entity].aggregate({query:{id:{$in:[...new Set(ids)]}},groupBy:'id',limit:1000});
  if(result.truncated)throw new Error('Accessible detail references exceed the reporting limit.');
  return new Set(result.rows.map(row=>row.id));
}
export function restrictCapacityOrganisation(report,projectIds,opportunityIds) {
  const visible=record=>{
    const project=/^\/projects\/([^/?#]+)$/.exec(record.href || '');
    const opportunity=/^\/opportunities\/([^/?#]+)$/.exec(record.href || '');
    return project ? projectIds.has(project[1]) : opportunity ? opportunityIds.has(opportunity[1]) : false;
  };
  const organisation=report.organisation;
  if(!organisation)return report;
  for(const role of ['bdm','bsm'])for(const owner of organisation[role].owners)for(const overlap of owner.overlaps)overlap.records=overlap.records.filter(visible);
  organisation.insights=organisation.insights.map(insight=>({...insight,records:insight.records.filter(visible)}));
  organisation.regions=organisation.regions.map(region=>({...region,records:region.records.filter(visible)}));
  organisation.summary.next=organisation.summary.next.filter(visible);
  return {...report,scope:'organisation-totals',detailScope:'rls'};
}