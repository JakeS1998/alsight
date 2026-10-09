import { propagateFlowProjectAccess } from './dataverseProjectReferences.ts';
import {syncDocumentApprovals} from './documentApprovalSync.ts';
import {refreshInsuranceAccountAccess} from './supplierInsuranceReferences.ts';
export async function applyFlowUpdates(base44, table, spec, updates, appliedReviews, sourceIds=updates.map(row=>row.dataverse_id)) {
  if (table === 'users') {
    for (let start = 0; start < updates.length; start += 4) {
      await Promise.all(updates.slice(start, start + 4).map(({ id, ...values }) => base44.entities.User.update(id, values)));
    }
  } else if (updates.length) {
    await base44.entities[spec.entity].upsert(updates.map(({ id, ...values }) => values), { key: 'dataverse_id' });
  }
  if (table === 'projects' && updates.length) await propagateFlowProjectAccess(base44, updates);
  if (table === 'accounts' && updates.length) {
    const accounts = await base44.entities.Account.filter({dataverse_id:{$in:updates.map(a=>a.dataverse_id)}},{limit:50,fields:['dataverse_id','linked_user_id']});
    await refreshInsuranceAccountAccess(base44, accounts.items);
  }
  if (['documents','dma','warranties'].includes(table) && sourceIds.length) {
    const page=await base44.entities[spec.entity].filter({dataverse_id:{$in:sourceIds}},{limit:50});
    await syncDocumentApprovals(base44,table,page.items);
  }
  if (appliedReviews.length) await base44.entities.DataverseSyncReview.bulkUpdate(appliedReviews.map(id => ({ id, status: 'applied', error: '', applied_at: new Date().toISOString() })));
}