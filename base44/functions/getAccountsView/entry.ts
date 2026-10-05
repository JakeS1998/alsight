import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const input = await req.json();
    const filters = input.filters || {};
    if (typeof filters !== 'object' || Array.isArray(filters) || Object.entries(filters).some(([key,value]) => !['search','relationship','organisation','region','owner','status','ase','live','opportunities'].includes(key) || typeof value !== 'string' || value.length > 120) || (input.cursor != null && (typeof input.cursor !== 'string' || input.cursor.length > 4096))) return Response.json({ error: 'Invalid account filters' }, { status: 400 });
    const clauses = [];
    if (input.accountId) {
      if (typeof input.accountId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.accountId)) return Response.json({ error: 'Invalid account' }, { status: 400 });
      // Keep the built-in id predicate at the top level of the final query.
    }
    if (filters.search) { const text = String(filters.search).slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); clauses.push({ $or: ['name','company_number','address_city','public_body_identifier'].map(field => ({ [field]: { $regex: text, $options: 'i' } })) }); }
    if (filters.relationship) clauses.push({ $or: [{ relationship_types: filters.relationship }, { account_type: filters.relationship }] });
    if (filters.organisation) clauses.push({ $or: [{ organisation_type: filters.organisation }, { company_type: filters.organisation }] });
    if (filters.region) clauses.push({ region: filters.region });
    if (filters.owner) clauses.push({ account_manager_aad_id: filters.owner });
    if (filters.status) clauses.push({ status: filters.status });
    if (filters.ase === 'unassessed') clauses.push({ $or: [{ ase_score: { $exists: false } }, { ase_score: null }] });
    else if (/^[1-5]$/.test(filters.ase || '')) clauses.push({ ase_score: Number(filters.ase) });
    const visibleMoney = ['admin','director','regional_director','bsm','finance','bdm','client'].includes(user.role);
    const liveQuery = { status: { $ne: 'inactive' }, live_project: true, approval_status: { $nin: ['complete','completed'] }, $or: [{ practical_completion_date: { $exists: false } }, { practical_completion_date: { $in: [null,''] } }, { practical_completion_date: { $gte: new Date().toISOString() } }] };
    const [projects, opportunities, activities, conversations, legal, warranties, contracts] = await Promise.all([
      base44.entities.Project.aggregate({ query: liveQuery, groupBy: ['id','dataverse_id','client_account_id','account_id'], ...(visibleMoney ? { sum: 'estimated_value' } : {}), limit: 1000 }),
      base44.entities.Opportunity.aggregate({ query: { status: 'open' }, groupBy: 'account_id', limit: 1000 }),
      base44.entities.CRMActivity.aggregate({ groupBy: 'account_id', max: 'occurred_at', limit: 1000 }),
      base44.entities.Conversation.aggregate({ groupBy: 'account_id', max: 'occurred_at', limit: 1000 }),
      base44.entities.LegalDocument.aggregate({ groupBy: ['account_id','client_account_id','project_id'], limit: 1000 }),
      base44.entities.Warranty.aggregate({ groupBy: ['account_id','supplier_id','client_account_id','project_id'], limit: 1000 }),
      base44.entities.JCT.aggregate({ groupBy: ['account_id','contractor_id','client_account_id','project_id'], limit: 1000 }),
    ]);
    if ([projects,opportunities,activities,conversations,legal,warranties,contracts].some(result => result.truncated)) return Response.json({ error: 'Account summaries exceed the reporting limit. Account reporting needs a narrower reporting scope.' }, { status: 422 });
    const links = new Map();
    for (const row of [...legal.rows,...warranties.rows,...contracts.rows]) {
      if (!row.project_id) continue;
      const related = links.get(row.project_id) || new Set();
      [row.account_id,row.client_account_id,row.supplier_id,row.contractor_id].filter(Boolean).forEach(key => related.add(key));
      links.set(row.project_id,related);
    }
    const groupedProjects = projects.rows.map(row => ({ ...row, accountKeys: [...new Set([row.client_account_id,row.account_id,...(links.get(row.id) || []),...(links.get(row.dataverse_id) || [])].filter(Boolean))] }));
    const projectKeys = [...new Set(groupedProjects.flatMap(row => row.accountKeys))];
    const opportunityKeys = opportunities.rows.map(row => row.account_id).filter(Boolean);
    const association = (keys, has) => ({ $or: [{ id: { [has ? '$in' : '$nin']: keys } }, { dataverse_id: { [has ? '$in' : '$nin']: keys } }] });
    if (filters.live) clauses.push(filters.live === 'yes' ? association(projectKeys, true) : { $and: [{ id: { $nin: projectKeys } }, { dataverse_id: { $nin: projectKeys } }] });
    if (filters.opportunities) clauses.push(filters.opportunities === 'yes' ? association(opportunityKeys, true) : { $and: [{ id: { $nin: opportunityKeys } }, { dataverse_id: { $nin: opportunityKeys } }] });
    const query = { ...(clauses.length ? { $and: clauses } : {}), ...(input.accountId ? { id: input.accountId } : {}) };
    const [page, total] = await Promise.all([base44.entities.Account.filter(query, { sort: 'name', limit: 30, ...(typeof input.cursor === 'string' ? { cursor: input.cursor } : {}) }), base44.entities.Account.count(query)]);
    const ownerIds = [...new Set(page.items.map(account => account.account_manager_aad_id).filter(Boolean))];
    const owners = ownerIds.length ? await base44.entities.Contact.filter({ $or: [{ aad_id: { $in: ownerIds } }, { dataverse_id: { $in: ownerIds } }, { id: { $in: ownerIds } }] }, { limit: 100, fields: ['full_name','aad_id','dataverse_id'] }) : { items: [] };
    const items = page.items.map(account => {
      const keys = [account.id,account.dataverse_id].filter(Boolean);
      const related = groupedProjects.filter(row => row.accountKeys.some(key => keys.includes(key)));
      const open = opportunities.rows.filter(row => keys.includes(row.account_id));
      const recent = [...activities.rows,...conversations.rows].filter(row => keys.includes(row.account_id)).map(row => row.max_occurred_at).filter(Boolean).sort().at(-1) || null;
      const owner = owners.items.find(row => [row.id,row.aad_id,row.dataverse_id].includes(account.account_manager_aad_id));
      return { account, signals: { activeProjects: related.reduce((sum,row) => sum + row.count, 0), openOpportunities: open.reduce((sum,row) => sum + row.count, 0), ...(visibleMoney ? { liveValue: related.reduce((sum,row) => sum + (row.sum_estimated_value || 0), 0) } : {}), lastInteraction: recent, owner: owner?.full_name || (account.account_manager_aad_id ? 'Assigned owner' : 'Not assigned') } };
    });
    return Response.json({ items, total, next_cursor: page.next_cursor, has_more: page.has_more });
  } catch (error) { return Response.json({ error: error.message || 'Unable to load accounts' }, { status: 500 }); }
}