import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { internalRoles } from '../../shared/asePolicy.ts';
import { accountDetailSignals } from '../../shared/accountDetailSignals.ts';
import { dataRequestError } from '../../shared/dataRequestError.ts';
const signalCache = new Map();
function cachedSignals(key,load) {
 const cached=signalCache.get(key);
 if(cached && (cached.pending || cached.expires>Date.now()))return cached.promise;
 if(signalCache.size>=100)signalCache.delete(signalCache.keys().next().value);
 const entry={pending:true,expires:0,promise:null};
 entry.promise=load().then(reports=>{entry.pending=false;entry.expires=Date.now()+60000;return reports;}).catch(error=>{if(signalCache.get(key)===entry)signalCache.delete(key);throw error;});
 signalCache.set(key,entry);
 return entry.promise;
}
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
    const internal = internalRoles.includes(user.role);
    let aseIds = null;
    if (filters.ase) {
      if (!internal) return Response.json({error:'ASE is internal-only.'},{status:403});
      if (filters.ase !== 'unassessed' && !/^[1-5]$/.test(filters.ase)) return Response.json({error:'Invalid ASE rating.'},{status:400});
      const bucket=Number(filters.ase),v2Query=filters.ase==='unassessed' ? {precise_score:{$gte:1}} : {precise_score:{$gte:Math.max(1,bucket-0.5),...(bucket<5 ? {$lt:bucket+0.5} : {$lte:5})}};
      const [rated,v2all,v2rated]=await Promise.all([base44.entities.ASECurrentRating.filter({displayed_rating:filters.ase==='unassessed' ? {$gte:1} : bucket},{limit:1000,fields:['account_id']}),base44.entities.ASEV2Current.filter({},{limit:1000,fields:['account_id']}),base44.entities.ASEV2Current.filter(v2Query,{limit:1000,fields:['account_id']})]);
      if ([rated,v2all,v2rated].some(p=>p.has_more)) return Response.json({error:'ASE filter exceeds the reporting limit.'},{status:422});
      const superseded=new Set(v2all.items.map(row=>row.account_id));
      aseIds=[...rated.items.filter(row=>!superseded.has(row.account_id)).map(row=>row.account_id),...v2rated.items.map(row=>row.account_id)];
    }
    const visibleMoney = ['admin','director','regional_director','bsm','finance','bdm','client'].includes(user.role);
    const liveQuery = { status: { $ne: 'inactive' }, live_project: true, approval_status: { $nin: ['complete','completed'] }, $or: [{ practical_completion_date: { $exists: false } }, { practical_completion_date: { $in: [null,''] } }, { practical_completion_date: { $gte: new Date().toISOString() } }] };
    const cacheKey = JSON.stringify([user.id,user.role,user.account_id,user.data?.account_id,user.region,user.data?.region,user.delegate_of,user.data?.delegate_of,user.delegate_region,user.data?.delegate_region,user.staff_aad_id,user.data?.staff_aad_id,Number.isSafeInteger(input.revision) ? input.revision : 0]);
    if(input.accountId)return Response.json(await cachedSignals(`${cacheKey}:${input.accountId}`,()=>accountDetailSignals(base44,input.accountId,internal,visibleMoney)));
    const reports = await cachedSignals(cacheKey,()=>Promise.all([
      base44.entities.Project.aggregate({ query: liveQuery, groupBy: ['id','dataverse_id','client_account_id','account_id'], ...(visibleMoney ? { sum: 'estimated_value' } : {}), limit: 1000 }),
      base44.entities.Opportunity.aggregate({ query: { status: 'open' }, groupBy: 'account_id', limit: 1000 }),
      base44.entities.CRMActivity.aggregate({ groupBy: 'account_id', max: 'occurred_at', limit: 1000 }),
      base44.entities.Conversation.aggregate({ groupBy: 'account_id', max: 'occurred_at', limit: 1000 }),
      base44.entities.LegalDocument.aggregate({ groupBy: ['account_id','client_account_id','project_id'], limit: 1000 }),
      base44.entities.Warranty.aggregate({ groupBy: ['account_id','supplier_id','client_account_id','project_id'], limit: 1000 }),
      base44.entities.JCT.aggregate({ groupBy: ['account_id','contractor_id','client_account_id','project_id'], limit: 1000 }),
    ]));
    const [projects, opportunities, activities, conversations, legal, warranties, contracts] = reports;
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
    let matchingIds = null;
    if (filters.live || filters.opportunities) {
      const identities = await base44.entities.Account.aggregate({ query: clauses.length ? { $and: clauses } : {}, groupBy: ['id','dataverse_id'], limit: 1000 });
      if (identities.truncated) return Response.json({ error: 'Account relationship filters exceed the reporting limit. Narrow your organisation filters.' }, { status: 422 });
      matchingIds = identities.rows.filter(row => {
        const hasLive = [row.id,row.dataverse_id].some(key => projectKeys.includes(key));
        const hasOpen = [row.id,row.dataverse_id].some(key => opportunityKeys.includes(key));
        return (!filters.live || hasLive === (filters.live === 'yes')) && (!filters.opportunities || hasOpen === (filters.opportunities === 'yes'));
      }).map(row => row.id);
    }
    if (matchingIds && aseIds) matchingIds = matchingIds.filter(id=>filters.ase==='unassessed' ? !aseIds.includes(id) : aseIds.includes(id));
    const query = { ...(clauses.length ? { $and: clauses } : {}), ...(matchingIds ? { id: { $in: matchingIds } } : aseIds ? {id:{[filters.ase==='unassessed' ? '$nin' : '$in']:aseIds}} : {}), ...(input.accountId ? { id: { $in: [input.accountId] } } : {}) };
    const [page, total] = await Promise.all([
      input.accountId ? base44.entities.Account.get(input.accountId).then(account => ({ items: account ? [account] : [], next_cursor: null, has_more: false })) : base44.entities.Account.filter(query, { ...(!query.id ? { sort: 'name' } : {}), limit: 30, ...(typeof input.cursor === 'string' ? { cursor: input.cursor } : {}) }),
      base44.entities.Account.count(query),
    ]);
    const ownerIds = [...new Set(page.items.map(account => account.account_manager_aad_id).filter(Boolean))];
    const owners = ownerIds.length ? await base44.entities.Contact.filter({ $or: [{ aad_id: { $in: ownerIds } }, { dataverse_id: { $in: ownerIds } }, { id: { $in: ownerIds } }] }, { limit: 100, fields: ['full_name','aad_id','dataverse_id'] }) : { items: [] };
    const [ratings,v2ratings] = internal && page.items.length ? await Promise.all([base44.entities.ASECurrentRating.filter({account_id:{$in:page.items.map(a=>a.id)}},{limit:30}),base44.entities.ASEV2Current.filter({account_id:{$in:page.items.map(a=>a.id)}},{limit:30})]) : [{items:[]},{items:[]}];
    const items = page.items.map(rawAccount => {
      const {ase_score,ase_reason,ase_assessed_at,...safeAccount}=rawAccount;
      const account = internal ? {...safeAccount,_ase:v2ratings.items.find(r=>r.account_id===rawAccount.id) || ratings.items.find(r=>r.account_id===rawAccount.id) || null} : safeAccount;
      const keys = [account.id,account.dataverse_id].filter(Boolean);
      const related = groupedProjects.filter(row => row.accountKeys.some(key => keys.includes(key)));
      const open = opportunities.rows.filter(row => keys.includes(row.account_id));
      const recent = [...activities.rows,...conversations.rows].filter(row => keys.includes(row.account_id)).map(row => row.max_occurred_at).filter(Boolean).sort().at(-1) || null;
      const owner = owners.items.find(row => [row.id,row.aad_id,row.dataverse_id].includes(account.account_manager_aad_id));
      return { account, signals: { activeProjects: related.reduce((sum,row) => sum + row.count, 0), openOpportunities: open.reduce((sum,row) => sum + row.count, 0), ...(visibleMoney ? { liveValue: related.reduce((sum,row) => sum + (row.sum_estimated_value || 0), 0) } : {}), lastInteraction: recent, owner: owner?.full_name || (account.account_manager_aad_id ? 'Assigned owner' : 'Not assigned') } };
    });
    return Response.json({ items, total, next_cursor: page.next_cursor, has_more: page.has_more });
  } catch (error) { return dataRequestError(error,'Unable to load accounts'); }
}