import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function FrameworkReportTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="w-full min-w-[950px] text-left text-sm">
      <thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr>
        <th scope="col" className="px-4 py-3">FW3 reference / ALSight project</th><th scope="col" className="px-4 py-3">Site and client</th><th scope="col" className="px-4 py-3">Project questionnaire</th><th scope="col" className="px-4 py-3">Access agreement</th><th scope="col" className="px-4 py-3 text-right">Call-off contract</th><th scope="col" className="px-4 py-3 text-right">Completion value</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map(r => <tr key={r.id} className="hover:bg-slate-50">
        <td className="px-4 py-4 align-top"><span className="block font-semibold text-slate-900">FW3 {r.framework_ref}</span>{r.project_id ? <Link to={`/projects/${r.project_id}`} className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline">Open ALSight project {r.project_number || ''}</Link> : <span className="mt-1 block text-xs text-slate-500">Workbook only · no ALSight link</span>}</td>
        <td className="px-4 py-4 align-top"><div className="font-medium text-slate-800">{r.site || 'Site not recorded'}</div><div className="mt-1 text-xs text-slate-500">Client: {r.client || 'Not recorded'}</div></td>
        <td className="px-4 py-4 align-top"><div>{r.pq_status || 'Status not recorded'}</div><div className="mt-1 text-xs text-slate-500">{r.pq_date ? formatDate(r.pq_date) : 'No date recorded'}</div></td>
        <td className="px-4 py-4 align-top">{r.aa_signed ? <><span className="font-medium text-slate-800">Signed</span><span className="mt-1 block text-xs text-slate-500">{formatDate(r.aa_signed)}</span></> : <span className="text-slate-500">No signed date recorded</span>}</td>
        <td className="px-4 py-4 text-right align-top"><div className="font-medium text-slate-800">{r.calloff_value != null ? formatCurrency(r.calloff_value) : '—'}</div><div className="mt-1 text-xs text-slate-500">{r.calloff_date ? formatDate(r.calloff_date) : 'No date recorded'}</div></td>
        <td className="px-4 py-4 text-right align-top font-medium text-slate-800">{r.completion_value != null ? formatCurrency(r.completion_value) : '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}