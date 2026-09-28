import React from 'react';
import { Pencil } from 'lucide-react';
import ContactProfileEditor from '@/components/crm/contact360/ContactProfileEditor';

export default function EditableContactCard({ title, section, children, editingSection, onEdit, editorProps, canEdit }) {
  const editing = editingSection === section;
  return <section className="min-w-0 rounded-xl border border-border bg-card p-5">
    <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{canEdit && !editing && <button type="button" onClick={() => onEdit(section)} aria-label={`Edit ${title}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /> Edit</button>}</div>
    {editing ? <div className="mt-3"><ContactProfileEditor key={`${section}-${editorProps.profile?.id || 'new'}`} section={section} embedded {...editorProps} /></div> : <div className="mt-3 space-y-3 text-sm">{children}</div>}
  </section>;
}