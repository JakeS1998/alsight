import React, { useState } from 'react';
import { RISK_COLUMNS, riskIndex } from '@/components/delivery/riskRegisterColumns';
import { riskHeat } from '@/components/delivery/riskHeat';
import RiskIndexBadge from '@/components/delivery/RiskIndexBadge';
import RiskHeatLegend from '@/components/delivery/RiskHeatLegend';
import RegisterSortHeading from '@/components/delivery/RegisterSortHeading';
import { Button } from '@/components/ui/button';
const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const extras = [{ key: 'category', label: 'Category' }, { key: 'probability', label: 'Legacy probability' }, { key: 'impact', label: 'Legacy impact' }, { key: 'target_resolution', label: 'Target resolution' }, { key: 'rag', label: 'RAG' }];
export default function RiskIssuedSnapshot({ snapshot, onComment, commentsDisabled = false }) {
  const [sort, setSort] = useState('reference');
  const columns = [...RISK_COLUMNS, ...extras.filter(column => snapshot.rows.some(row => row[column.key] != null && row[column.key] !== ''))];
  const key = sort.replace(/^-/, '');
  const valueOf = row => key === 'risk_index' ? riskIndex(row) : row[key];
  const numeric = ['risk_index', 'probability_rating', 'impact_rating', 'anticipated_cost', 'weighted_cost'].includes(key);
  const rows = [...snapshot.rows].sort((a, b) => {
    const left = valueOf(a), right = valueOf(b);
    const leftMissing = left == null || left === '', rightMissing = right == null || right === '';
    if (leftMissing || rightMissing) return leftMissing === rightMissing ? 0 : leftMissing ? 1 : -1;
    const comparison = numeric ? Number(left) - Number(right) : String(left).localeCompare(String(right));
    return sort.startsWith('-') ? -comparison : comparison;
  });
  return <section className="space-y-3" aria-label="Full issued risk register">
    <div><h2 className="font-bold">{snapshot.reference} · Issued register</h2><p className="text-xs text-muted-foreground">{snapshot.projectName} · Issued by {snapshot.issuedBy} on {new Date(snapshot.issuedAt).toLocaleString('en-GB')} · {snapshot.rows.length} risks</p></div>
    <p className="text-xs text-muted-foreground">This is the locked issued version, not the editable live register. All recorded risk details appear below.</p>
    <RiskHeatLegend />
    <div className="max-h-[65vh] overflow-auto rounded-lg border"><table className="w-full border-collapse text-left text-xs"><thead className="sticky top-0 z-10 bg-muted"><tr>{columns.map(column => <RegisterSortHeading key={column.key} column={column} sort={sort} onSort={setSort} loading={false} />)}{onComment && <th scope="col" className="sticky right-0 bg-muted p-3">Review feedback</th>}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className={`align-top ${riskHeat(riskIndex(row)).rowClass}`}>{columns.map(column => { const value = row[column.key]; return <td key={column.key} className="max-w-sm whitespace-pre-wrap break-words border-b p-3">{column.key === 'risk_index' ? <RiskIndexBadge index={riskIndex(row)} /> : value == null || value === '' ? 'Not recorded' : ['anticipated_cost', 'weighted_cost'].includes(column.key) ? money(value) : String(value)}</td>; })}{onComment && <td className="sticky right-0 border-b bg-card p-3"><Button size="sm" variant="outline" disabled={commentsDisabled} onClick={() => onComment(row)} aria-label={`Add comment to risk ${row.reference || row.title}`}>Add comment</Button></td>}</tr>)}</tbody></table></div>
  </section>;
}