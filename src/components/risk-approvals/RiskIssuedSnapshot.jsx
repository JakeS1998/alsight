import React from 'react';
import { RISK_COLUMNS } from '@/components/delivery/riskRegisterColumns';
const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const extras = [{ key: 'category', label: 'Category' }, { key: 'probability', label: 'Legacy probability' }, { key: 'impact', label: 'Legacy impact' }, { key: 'target_resolution', label: 'Target resolution' }, { key: 'rag', label: 'RAG' }];
export default function RiskIssuedSnapshot({ snapshot }) {
  const columns = [...RISK_COLUMNS, ...extras.filter(column => snapshot.rows.some(row => row[column.key] != null && row[column.key] !== ''))];
  return <section className="space-y-3" aria-label="Full issued risk register">
    <div><h2 className="font-bold">{snapshot.reference} · Issued register</h2><p className="text-xs text-muted-foreground">{snapshot.projectName} · Issued by {snapshot.issuedBy} on {new Date(snapshot.issuedAt).toLocaleString('en-GB')} · {snapshot.rows.length} risks</p></div>
    <p className="text-xs text-muted-foreground">This is the locked issued version, not the editable live register. All recorded risk details appear below.</p>
    <div className="max-h-[65vh] overflow-auto rounded-lg border"><table className="w-full border-collapse text-left text-xs"><thead className="sticky top-0 bg-muted"><tr>{columns.map(column => <th key={column.key} className="min-w-28 border-b p-3 font-bold">{column.label}</th>)}</tr></thead><tbody>{snapshot.rows.map(row => <tr key={row.id} className="align-top">{columns.map(column => { const value = row[column.key]; return <td key={column.key} className="max-w-sm whitespace-pre-wrap break-words border-b p-3">{value == null || value === '' ? 'Not recorded' : ['anticipated_cost', 'weighted_cost'].includes(column.key) ? money(value) : String(value)}</td>; })}</tr>)}</tbody></table></div>
  </section>;
}