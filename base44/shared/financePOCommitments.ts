import { financePOFallbacks } from './financePOFallbacks.ts';
export async function financePOCommitments(db, base, amounts) {
 const headers = amounts.find(row => row.kind === 'purchase_orders' && row.has_amount);
 const blanks = amounts.find(row => row.kind === 'purchase_orders' && !row.has_amount)?.count || 0;
 let amount = headers?.sum_amount || 0, fallbackCount = 0, partialCount = 0, missingLines = 0;
 for await (const row of financePOFallbacks(db, base)) {
  if (row.valued) { amount += row.amount; fallbackCount++; }
  if (row.valued && row.missing) { partialCount++; missingLines += row.missing; }
 }
 return { amount: (headers?.count || fallbackCount) ? amount : null, header_count: headers?.count || 0, fallback_count: fallbackCount, partial_count: partialCount, missing_count: blanks - fallbackCount, missing_line_count: missingLines };
}