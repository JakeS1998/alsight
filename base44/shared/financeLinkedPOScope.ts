async function distinctValues(entity, query, field) {
 const values = [];
 let cursor;
 do {
  const page = await entity.filter(query, { distinct: field, limit: 500, ...(cursor ? { cursor } : {}) });
  values.push(...page.items);
  if (!page.has_more) return values;
  cursor = page.next_cursor;
  if (!cursor) throw new Error('Linked purchase-order pagination could not continue.');
 } while (cursor);
 return values;
}
export async function financeLinkedPOScope(db, state, base) {
 const keys = await distinctValues(db.FinanceProjectMapping, { dataset_id: state.namespace, status: { $in: ['automatic', 'manual'] }, project_id: { $exists: true, $nin: ['', null] } }, 'source_key');
 const headers = { ...base, kind: 'purchase_orders', project_key: { $in: keys } };
 const parents = await distinctValues(db.FinanceDataverseRecord, headers, 'source_id');
 const lines = { ...base, kind: 'line_items', parent_id: { $in: parents } };
 return { headers, lines };
}