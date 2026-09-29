import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function FrameworkReportRows({ rows, internal }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[920px] text-left text-sm">
    <thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr><th className="px-4 py-3">FW3 / Project</th><th className="px-4 py-3">Site and client</th><th className="px-4 py-3">Questionnaire</th><th className="px-4 py-3">Agreement</th><th className="px-4 py-3">Call-off</th><th className="px-4 py-3">Delivery outcomes</th>{internal && <th className="px-4 py-3 text-right">Completion value</th>}</tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.map(r => <tr key={r.id} className="hover:bg-slate-50">
      <td className="px-4 py-4 align-top"><Link to={r.project_id ? `/projects/${r.project_id}?tab=uklf` : `/framework-reports/${r.id}`} className="font-semibold text-als-navy hover:underline">{r.project_number || (/^\d+$/.test(r.framework_ref || '') ? `PROJ${r.framework_ref}` : `FW3 ${r.framework_ref}`)}</Link>{r.project_number && r.framework_ref && !r.project_number.toUpperCase().endsWith(r.framework_ref.toUpperCase()) && <span className="block text-xs text-slate-500">Workbook FW3 {r.framework_ref}</span>}<span className="block text-xs text-primary">Open UKLF details</span></td>
      <td className="px-4 py-4 align-top">{r.site || '—'}<span className="block text-xs text-slate-500">{r.client || 'Client not recorded'}</span></td>
      <td className="px-4 py-4 align-top">{r.pq_status || '—'}<span className="block text-xs text-slate-500">{formatDate(r.pq_date)}</span></td>
      <td className="px-4 py-4 align-top">{formatDate(r.aa_signed)}</td>
      <td className="px-4 py-4 align-top">{formatDate(r.calloff_date)}{internal && <span className="block text-xs text-slate-500">{formatCurrency(r.calloff_value)}</span>}</td>
      <td className="px-4 py-4 align-top text-xs">On time: {r.completed_on_time || '—'}<br />To budget: {r.completed_to_budget || '—'}<br />RIDDOR incidents: {r.riddor_incidents ?? '—'}</td>
      {internal && <td className="px-4 py-4 text-right align-top">{formatCurrency(r.completion_value)}</td>}
    </tr>)}</tbody>
  </table></div>;
}