import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, DOCUMENT_TYPE } from '@/lib/portal';
import { bssRegisters, bssStatus } from '@/components/bss/bssConfig';
export default function BssRegisterTable({ rows, tab, onSelect }) {
  const isProject = tab === 'projects';
  return <div className="overflow-x-auto rounded-panel border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted text-xs text-muted-foreground"><tr>{['Reference', isProject ? 'Project' : 'Project / document', isProject ? 'Client' : 'Supplier / party', 'Recorded status', isProject ? 'Live project' : 'Due date', 'Updated'].map(label => <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(row => {
    const { record, project, party, client } = row;
    const reference = record[bssRegisters[tab].reference] || 'Reference not recorded';
    return <tr key={record.id} className="hover:bg-muted/50"><td className="whitespace-nowrap px-4 py-4 font-medium">{isProject ? <Link to={`/projects/${record.id}`} className="hover:underline">{reference}</Link> : <button type="button" onClick={() => onSelect(row)} className="text-left font-semibold underline-offset-4 hover:underline">{reference}</button>}</td>
      <td className="min-w-64 px-4 py-4">{project ? <Link to={`/projects/${project.id}?tab=${isProject ? 'general' : tab === 'warranties' ? 'warranties' : 'drafting'}`} className="font-medium hover:underline">{project.name}</Link> : <span className="text-muted-foreground">Project name unavailable</span>}{!isProject && <p className="mt-1 text-xs text-muted-foreground">{tab === 'documents' ? DOCUMENT_TYPE[record.document_type]?.label || record.document_type || 'Document' : record.services || bssRegisters[tab].label}</p>}</td>
      <td className="min-w-40 px-4 py-4">{(isProject ? client : party) ? <Link to={`/accounts/${(isProject ? client : party).id}`} className="hover:underline">{(isProject ? client : party).name}</Link> : <span className="text-muted-foreground">Not available</span>}</td>
      <td className="px-4 py-4"><span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs capitalize">{bssStatus(record, tab)}</span></td>
      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{isProject ? record.live_project === true ? 'Yes' : record.live_project === false ? 'No' : 'Not recorded' : formatDate(tab === 'warranties' ? record.warranty_due : record.drafting_due_date)}</td>
      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{formatDate(record.updated_date)}</td></tr>;
  })}</tbody></table></div>;
}