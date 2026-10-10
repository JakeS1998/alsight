export async function financePOCommitments(db, base, amounts) {
 const headers = amounts.find(row => row.kind === 'purchase_orders' && row.has_amount);
 const blanks = amounts.find(row => row.kind === 'purchase_orders' && !row.has_amount)?.count || 0;
 let amount = headers?.sum_amount || 0, fallbackCount = 0, partialCount = 0, missingLines = 0, cursor;
 do {
  const page = await db.FinanceDataverseRecord.filter({ ...base, kind: 'purchase_orders', has_amount: false }, { distinct: 'source_id', limit: 500, ...(cursor ? { cursor } : {}) });
  if (page.items.length) {
   const totals = await db.FinanceDataverseRecord.aggregate({ query: { ...base, kind: 'line_items', parent_id: { $in: page.items } }, groupBy: ['parent_id', 'has_amount'], sum: 'amount', limit: 1000 });
   if (totals.truncated) throw new Error('PO commitment aggregation exceeded its grouping limit.');
   const valued = new Set(totals.rows.filter(row => row.has_amount).map(row => row.parent_id));
   for (const row of totals.rows) {
    if (row.has_amount) { amount += row.sum_amount || 0; fallbackCount++; }
    else if (valued.has(row.parent_id)) { partialCount++; missingLines += row.count; }
   }
  }
  if (!page.has_more) break;
  cursor = page.next_cursor;
  if (!cursor) throw new Error('PO commitment pagination could not continue.');
 } while (cursor);
 return { amount: (headers?.count || fallbackCount) ? amount : null, header_count: headers?.count || 0, fallback_count: fallbackCount, partial_count: partialCount, missing_count: blanks - fallbackCount, missing_line_count: missingLines };
}