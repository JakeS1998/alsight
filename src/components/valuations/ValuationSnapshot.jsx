import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';
import { formatCurrency, formatDate } from '@/lib/portal';
import { StatusPill, sum, valuationTotals } from './valuationUtils';

export default function ValuationSnapshot({ project, finance = false }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; filterAll(base44.entities.Valuation, { project_id: project.id }).then(data => { if (active) setRows(data); }).catch(() => {}).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [project.id]);
  const latest = [...rows].sort((a,b) => b.number - a.number)[0];
  const approved = rows.filter(v => ['approved','paid'].includes(v.status));
  const certified = Math.max(0, ...approved.map(v => Number(v.approved_gross) || 0));
  const paid = sum(rows.filter(v => v.status === 'paid'), v => v.amount_paid);
  const retention = sum(approved, v => v.approved_retention);
  const contract = valuationTotals(latest || {}).contract || Number(project.estimated_value || 0);
  const variations = valuationTotals(latest || {}).variations;
  const alert = latest?.payment_due_date && !['paid','rejected'].includes(latest.status) && latest.payment_due_date < new Date().toISOString().slice(0,10) ? 'Payment overdue' : latest?.status === 'submitted' || latest?.status === 'under_review' ? 'Awaiting Alliance review' : latest?.status === 'returned' ? 'Returned for amendment' : latest?.status === 'approved' && latest.payment_status === 'awaiting_invoice' ? 'Awaiting invoice' : '';
  return <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-heading text-sm font-semibold text-als-navy">{finance ? 'Valuation financial position' : 'Latest Valuation'}</h3>
    {loading ? <p className="mt-3 text-sm text-muted-foreground">Loading valuations…</p> : !latest ? <p className="mt-3 text-sm text-muted-foreground">No valuations submitted yet.</p> : <>
      {!finance && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><strong>Valuation {latest.number}</strong><span>{formatCurrency(latest.approved_net ?? valuationTotals(latest).due)} due</span><span>Submitted {formatDate(latest.submitted_at)}</span><StatusPill status={latest.status} /></div>}
      {finance && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Original contract sum (or estimate)',contract],['Schedule variations',variations],['Revised contract sum',contract + variations],['Certified to date',certified],['Paid to date',paid],['Retention held',retention],['Remaining contract value',Math.max(0,contract + variations - certified)],['Forecast final account (contract basis)',contract + variations]].map(([label,amount]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{formatCurrency(amount)}</p></div>)}</div>}
      {alert && <p className="mt-2 text-sm font-medium text-amber-700">{alert}</p>}
      <Link className="mt-3 inline-block text-sm font-semibold text-als-navy-light underline" to={`/projects/${project.id}?tab=valuations&valuation=${latest.id}`}>View Valuation</Link>
    </>}
  </section>;
}