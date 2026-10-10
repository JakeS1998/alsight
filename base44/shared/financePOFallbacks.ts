export async function* financePOFallbacks(db, base) {
 let cursor;
 do {
  const page = await db.FinanceDataverseRecord.filter({ ...base, kind: 'purchase_orders', has_amount: false }, { fields: ['source_id', 'project_key'], limit: 500, ...(cursor ? { cursor } : {}) });
  if (page.items.length) {
   const { project_key, ...lineBase } = base;
   const totals = await db.FinanceDataverseRecord.aggregate({ query: { ...lineBase, kind: 'line_items', parent_id: { $in: page.items.map(row => row.source_id) } }, groupBy: ['parent_id', 'has_amount'], sum: 'amount', limit: 1000 });
   if (totals.truncated) throw new Error('PO commitment aggregation exceeded its grouping limit.');
   const valued = new Map(totals.rows.filter(row => row.has_amount).map(row => [row.parent_id, row]));
   const missing = new Map(totals.rows.filter(row => !row.has_amount).map(row => [row.parent_id, row.count]));
   for (const header of page.items) yield { project_key: header.project_key, amount: valued.get(header.source_id)?.sum_amount || 0, valued: valued.has(header.source_id), missing: missing.get(header.source_id) || 0 };
  }
  if (!page.has_more) break;
  cursor = page.next_cursor;
  if (!cursor) throw new Error('PO commitment pagination could not continue.');
 } while (cursor);
}