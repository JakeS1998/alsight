import React from 'react';
import { formatDate } from '@/lib/portal';

export default function StakeholderReportTable({ rows }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[860px] text-left text-sm">
    <thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr>{['FW3 reference', 'Site and client', 'Questionnaire', 'Agreement signed', 'Call-off date', 'Delivery outcomes'].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.id}>
      <td className="px-4 py-4 font-semibold">FW3 {row.framework_ref}</td>
      <td className="px-4 py-4">{row.site || '—'}<span className="block text-xs text-slate-500">{row.client || 'Client not recorded'}</span></td>
      <td className="px-4 py-4">{row.pq_status || '—'}<span className="block text-xs text-slate-500">{formatDate(row.pq_date)}</span></td>
      <td className="px-4 py-4">{formatDate(row.aa_signed)}</td><td className="px-4 py-4">{formatDate(row.calloff_date)}</td>
      <td className="px-4 py-4 text-xs"><span className="block">On time: {row.completed_on_time || '—'}</span><span className="block">To budget: {row.completed_to_budget || '—'}</span><span className="block">Zero RIDDOR: {row.zero_riddor || '—'}</span><span className="block">Apprenticeships: {row.apprenticeships ?? '—'}</span></td>
    </tr>)}</tbody>
  </table></div>;
}