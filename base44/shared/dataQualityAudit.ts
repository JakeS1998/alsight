import { active, blank, directQueries, importedEntities, missing, present, projectState, feeProblems, parseList } from './dataQualityRules.ts';

async function* pages(entity, query, fields, sort = 'id') {
  let cursor;
  do {
    const page = await entity.filter(query, { sort, limit: 100, fields, ...(cursor ? { cursor } : {}) });
    yield page.items;
    if (!page.has_more) break;
    if (!page.next_cursor || page.next_cursor === cursor) throw new Error('Unable to continue the quality check.');
    cursor = page.next_cursor;
  } while (true);
}
function collector(offset) {
  let total = 0;
  const items = [];
  return { add(item) { if (total >= offset && items.length < 50) items.push(item); total++; }, result() { return { total, items, nextOffset: offset + items.length < total ? offset + items.length : null }; } };
}
function projectIssue(project, reason, tab = 'general') {
  return { id: project.id, entity: 'Project', label: project.name || project.project_number || project.id, reference: project.project_number || '', reason, href: `/projects/${project.id}?tab=${tab}` };
}
async function latestByProject(entity, ids, fields, proposals = false) {
  const map = new Map();
  for await (const rows of pages(entity, { project_id: { $in: ids } }, fields)) {
    for (const row of rows) {
      const old = map.get(row.project_id);
      const newer = proposals ? (!old || (row.is_current && !old.is_current) || (!!row.is_current === !!old.is_current && Number(row.revision_number || 0) > Number(old.revision_number || 0))) : (!old || String(row.created_date || '') > String(old.created_date || ''));
      if (newer) map.set(row.project_id, row);
    }
  }
  return map;
}
export async function auditProjects(db, selected, offset = 0) {
  const wanted = key => !selected || selected === key;
  const buckets = Object.fromEntries(['dates', 'jct', 'fees', 'supplier'].map(key => [key, collector(offset)]));
  const fields = ['name', 'project_number', 'dataverse_id', 'live_project', 'approval_status', 'practical_completion_date', 'aa_executed_date', 'construction_term_weeks', ...[1,2,3,4,5].flatMap(n => [`riba${n}_end`, `riba${n}_system_date`, `riba${n}_term_weeks`])];
  for await (const projects of pages(db.Project, active, fields)) {
    if (!projects.length) continue;
    const ids = projects.map(p => p.id);
    const refs = [...new Set(projects.flatMap(p => [p.id, p.dataverse_id]).filter(Boolean))];
    const [deliveries, proposals, jctGroups] = await Promise.all([
      wanted('jct') || wanted('supplier') ? latestByProject(db.ProjectDelivery, ids, ['project_id', 'created_date', 'delivery_team', 'contract_start', 'pc_achieved']) : new Map(),
      wanted('fees') ? latestByProject(db.FeeProposal, ids, ['project_id', 'is_current', 'revision_number', 'fee_value', 'fee_basis', 'line_items'], true) : new Map(),
      wanted('jct') ? db.JCT.aggregate({ query: { ...active, project_id: { $in: refs } }, groupBy: 'project_id', limit: 1000 }) : { rows: [] },
    ]);
    const withJct = new Set(jctGroups.rows.map(row => row.project_id));
    for (const project of projects) {
      const state = projectState(project);
      const delivery = deliveries.get(project.id);
      if (wanted('dates') && project.live_project && !state.completed && state.missingDate) buckets.dates.add(projectIssue(project, `RIBA ${state.stage === 5 ? '5–7' : state.stage}: no valid completion date`, 'timeline'));
      if (wanted('jct') && !state.completed && !state.past(delivery?.pc_achieved) && (state.stage === 5 || state.past(delivery?.contract_start)) && !withJct.has(project.id) && !withJct.has(project.dataverse_id)) buckets.jct.add(projectIssue(project, 'Construction commenced / RIBA 5–7, but no active linked JCT', 'drafting'));
      const proposal = proposals.get(project.id);
      if (wanted('fees') && proposal) {
        const problems = feeProblems(proposal);
        if (problems.length) buckets.fees.add(projectIssue(project, `Fee proposal R${proposal.revision_number || 1}: ${problems.join('; ')}`, 'delivery'));
      }
      if (wanted('supplier') && delivery) {
        const team = parseList(delivery.delivery_team);
        const missingMembers = team?.filter(member => !member || blank(member.fee_proposal_link));
        if (team === null || missingMembers?.length) buckets.supplier.add(projectIssue(project, team === null ? 'Delivery team data cannot be read; supplier proposals cannot be verified' : `No proposal document: ${missingMembers.map((member, index) => member?.role || member?.supplier_company_number || `Team member ${index + 1}`).join(', ')}`, 'delivery'));
      }
    }
  }
  return Object.fromEntries(Object.entries(buckets).map(([key, bucket]) => [key, bucket.result()]));
}
export async function duplicateContacts(db, offset = 0, includeItems = false) {
  const bucket = collector(offset);
  let after;
  do {
    const result = await db.Contact.aggregate({ query: { $and: [active, present('email'), ...(after ? [{ email: { $gt: after } }] : [])] }, groupBy: 'email', having: { count: { $gt: 1 } }, sort: 'email', limit: 1000 });
    for (const row of result.rows) bucket.add({ id: row.email, entity: 'Contact group', label: row.email, reference: `${row.count} contacts`, reason: 'Same primary email address — potential duplicate', email: row.email });
    if (!result.truncated || !result.rows.length) break;
    const next = result.rows[result.rows.length - 1].email;
    if (next === after) throw new Error('Unable to continue duplicate checks.');
    after = next;
  } while (true);
  const result = bucket.result();
  if (includeItems) {
    for (const item of result.items) {
      const page = await db.Contact.filter({ ...active, email: item.email }, { sort: 'full_name', limit: 5, fields: ['full_name'] });
      item.related = page.items.map(contact => ({ label: contact.full_name || contact.id, href: `/contacts/${contact.id}` }));
      item.moreContacts = page.has_more;
    }
  }
  return result;
}
async function recordIssues(db, entityName, rows, reason) {
  const legal = ['LegalDocument', 'DMA', 'JCT', 'Warranty'].includes(entityName);
  const refs = legal ? [...new Set(rows.map(row => row.project_id).filter(Boolean))] : [];
  const projects = refs.length ? await db.Project.filter({ $or: [{ id: { $in: refs } }, { dataverse_id: { $in: refs } }] }, { limit: 100, fields: ['name', 'dataverse_id', 'status'] }) : { items: [] };
  const map = new Map(projects.items.flatMap(p => [[p.id, p], [p.dataverse_id, p]]));
  return rows.map(row => {
    const project = map.get(row.project_id);
    const href = entityName === 'Project' ? row.status === 'inactive' ? '/projects' : `/projects/${row.id}` : entityName === 'Contact' ? `/contacts/${row.id}` : entityName === 'Account' ? `/accounts/${row.id}` : project && project.status !== 'inactive' ? `/projects/${project.id}?tab=${entityName === 'Warranty' ? 'warranties' : 'drafting'}` : entityName === 'Warranty' ? '/warranties' : '/documents';
    return { id: `${entityName}:${row.id}`, entity: entityName, label: row.name || row.full_name || row.document_id || row.warranty_id || row.id, reference: row.project_number || project?.name || '', reason, href };
  });
}
export async function directCheck(db, key, offset = 0, includeItems = false) {
  const sources = key === 'dataverse' ? importedEntities.map(entity => ({ entity, query: missing('dataverse_id') })) : [{ entity: 'Project', query: directQueries[key] }];
  let total = 0;
  let remaining = offset;
  const items = [];
  const breakdown = [];
  for (const source of sources) {
    const count = await db[source.entity].count(source.query);
    total += count;
    breakdown.push({ entity: source.entity, count });
    if (!includeItems || items.length >= 50) continue;
    if (remaining >= count) { remaining -= count; continue; }
    const fields = ['Project', 'Account'].includes(source.entity) ? ['name', 'project_number', 'status'] : source.entity === 'Contact' ? ['full_name'] : ['document_id', 'warranty_id', 'project_id'];
    for await (const rows of pages(db[source.entity], source.query, fields)) {
      if (remaining >= rows.length) { remaining -= rows.length; continue; }
      const picked = rows.slice(remaining, remaining + 50 - items.length);
      remaining = 0;
      items.push(...await recordIssues(db, source.entity, picked, key === 'dataverse' ? 'No Dataverse ID — verify whether this is a native ALSight record' : key === 'client' ? 'No client/account link or client name' : `No ${ { postcode: 'site postcode', bdm: 'BDM assignment', bsm: 'BSM assignment' }[key] }`));
      if (items.length >= 50) break;
    }
  }
  return { total, items, breakdown, nextOffset: offset + items.length < total ? offset + items.length : null };
}