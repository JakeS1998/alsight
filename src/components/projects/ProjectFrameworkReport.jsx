import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function ProjectFrameworkReport({ project }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.FrameworkProjectReport.filter({ project_id: project.id }, { limit: 2 }).then(page => {
      if (active) setReport(page.items[0] || null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [project.id]);
  if (loading) return <div className="text-sm text-slate-500">Loading framework report…</div>;
  if (!report) return null;
  const fields = [
    ['Framework reference', report.framework_ref], ['PQ decision', report.pq_status],
    ['PQ date', formatDate(report.pq_date)], ['Indicative value', report.indicative_value != null ? formatCurrency(report.indicative_value) : null],
    ['AA signed', formatDate(report.aa_signed)], ['AA value', report.aa_value != null ? formatCurrency(report.aa_value) : null],
    ['Call-off value', report.calloff_value != null ? formatCurrency(report.calloff_value) : null],
    ['Completion value', report.completion_value != null ? formatCurrency(report.completion_value) : null],
    ['Completed on time', report.completed_on_time], ['Completed to budget', report.completed_to_budget],
    ['Zero RIDDOR incidents', report.zero_riddor], ['Local spend', report.local_spend != null ? formatCurrency(report.local_spend) : null],
    ['Apprenticeships', report.apprenticeships],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="mb-1 font-semibold text-slate-900">Framework reporting</h3><p className="mb-4 text-xs text-slate-500">Workbook figures are shown separately; ALSight project values take precedence.</p><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm font-medium text-slate-800">{value}</dd></div>)}</dl></section>;
}