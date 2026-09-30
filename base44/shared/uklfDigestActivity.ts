function londonMonthStart(year, month) {
  const utc = new Date(Date.UTC(year, month, 1));
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'shortOffset' }).formatToParts(utc).find(part => part.type === 'timeZoneName').value;
  const offset = Number(zone.match(/GMT\+([0-9]+)/)?.[1] || 0);
  return new Date(utc.getTime() - offset * 3600000).toISOString();
}

export async function uklfDigestActivity(db, now, previousMonth = false) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: 'numeric' }).formatToParts(now).map(part => [part.type, part.value]));
  const monthDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1 - Number(previousMonth), 15));
  const year = monthDate.getUTCFullYear(), month = monthDate.getUTCMonth();
  const range = { $gte: londonMonthStart(year, month), $lt: londonMonthStart(year, month + 1) };
  const executionQuery = { executed: 'yes', date_of_execution: range };
  const approved = await db.Project.count({ procurement_route: true, pq_approval_date: range });
  const refs = [];
  let cursor;
  do {
    const page = await db.DMA.filter(executionQuery, { distinct: 'project_id', limit: 500, cursor });
    refs.push(...page.items.filter(Boolean));
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  const linkedProjectIds = new Set(), dmaProjectRefs = [];
  for (let index = 0; index < refs.length; index += 200) {
    const batch = refs.slice(index, index + 200);
    const query = { procurement_route: true, $or: [{ id: { $in: batch } }, { dataverse_id: { $in: batch } }] };
    do {
      const page = await db.Project.filter(query, { fields: ['dataverse_id'], limit: 500, cursor });
      for (const project of page.items) {
        linkedProjectIds.add(project.id);
        dmaProjectRefs.push(project.id);
        if (project.dataverse_id) dmaProjectRefs.push(project.dataverse_id);
      }
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
  }
  const dmaCount = dmaProjectRefs.length ? await db.DMA.count({ ...executionQuery, project_id: { $in: dmaProjectRefs } }) : 0;
  const projectIds = [...linkedProjectIds];
  let calloffValue = 0, valuedProjects = 0;
  for (let index = 0; index < projectIds.length; index += 200) {
    const result = await db.FrameworkProjectReport.aggregate({ query: { project_id: { $in: projectIds.slice(index, index + 200) }, calloff_value: { $exists: true, $ne: null } }, sum: 'calloff_value', countDistinct: 'project_id' });
    const row = result.rows[0] || {};
    calloffValue += row.sum_calloff_value || 0;
    valuedProjects += row.count_distinct_project_id || 0;
  }
  const projectsWithDma = projectIds.length ? await db.Project.count({ id: { $in: projectIds } }) : 0;
  return { month: monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' }), approved, dmaCount, calloffValue, valuedProjects, missingValues: projectsWithDma - valuedProjects };
}