import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function FrameworkReportTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="w-full min-w-[850px] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
        <th className="px-4 py-3">Framework / project</th><th className="px-4 py-3">Site & client</th><th className="px-4 py-3">PQ</th><th className="px-4 py-3">AA signed</th><th className="px-4 py-3 text-right">Call-off</th><th className="px-4 py-3 text-right">Completion</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map(r => <tr key={r.id} className="hover:bg-slate-50">
        <td className="px-4 py-3 align-top"><span className="font-semibold text-slate-900">{r.framework_ref}</span><div className="text-xs text-slate-500">{r.project_id ? <Link to={`/projects/${r.project_id}`} className="text-primary hover:underline">{r.project_number || 'Open project'}</Link> : 'Not linked in ALSight'}</div></td>
        <td className="px-4 py-3 align-top"><div className="font-medium text-slate-800">{r.site || '—'}</div><div className="text-xs text-slate-500">{r.client || '—'}</div></td>
        <td className="px-4 py-3 align-top">{r.pq_status || '—'}</td><td className="px-4 py-3 align-top">{r.aa_signed ? formatDate(r.aa_signed) : '—'}</td>
        <td className="px-4 py-3 text-right align-top">{r.calloff_value != null ? formatCurrency(r.calloff_value) : '—'}</td><td className="px-4 py-3 text-right align-top">{r.completion_value != null ? formatCurrency(r.completion_value) : '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}