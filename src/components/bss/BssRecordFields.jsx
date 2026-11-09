import React from 'react';
import { ExternalLink } from 'lucide-react';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
import { formatDate, DOCUMENT_TYPE, FORM_OF_JCT } from '@/lib/portal';
import { commonFields, extraFields, safeBssLink } from '@/components/bss/bssConfig';
export default function BssRecordFields({ record, tab }) {
  const groups = [...(extraFields[tab] || []), ...commonFields];
  const omitted = tab === 'warranties' ? ['executed', 'signing_target_date', 'drafting_due_date', 'is_bsm_document_owner'] : tab === 'jct' ? ['approval_status', 'approvers_name', 'approval_date', 'approval_comments'] : [];
  return <div className="grid gap-4 lg:grid-cols-2">{groups.map(([title, fields]) => <section key={title} className="space-y-3 rounded-panel border border-border bg-card p-4"><h3 className="text-sm font-semibold">{title}</h3><dl className="space-y-3">{fields.filter(([, field]) => !omitted.includes(field)).map(([label, field, type]) => {
    const raw = record[field], href = type === 'link' && safeBssLink(raw);
    const value = raw === null || raw === undefined || raw === '' ? 'Not recorded' : type === 'date' ? formatDate(raw) : typeof raw === 'boolean' ? raw ? 'Yes' : 'No' : field === 'document_type' ? DOCUMENT_TYPE[raw]?.label || raw : field === 'form_of_jct' ? FORM_OF_JCT[raw]?.label || raw : String(raw).replaceAll('_', ' ');
    return <div key={field} className="grid gap-1 text-sm"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="min-w-0 whitespace-pre-wrap break-words"><InlineDataverseField field={field} label={label}>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium hover:underline">Open {label.toLowerCase()}<ExternalLink className="h-3 w-3" /></a> : <span>{type === 'link' && raw ? 'File link unavailable' : value}</span>}</InlineDataverseField></dd></div>;
  })}</dl></section>)}</div>;
}