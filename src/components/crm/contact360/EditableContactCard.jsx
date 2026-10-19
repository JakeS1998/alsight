import React from 'react';
import InlineEditTrigger from '@/components/forms/InlineEditTrigger';
import ContactInlineEditContext from '@/components/crm/contact360/ContactInlineEditContext';
import ContactProfileEditor from '@/components/crm/contact360/ContactProfileEditor';

export default function EditableContactCard({ title, section, children, editingSection, onEdit, editorProps, canEdit }) {
  const editing = editingSection === section;
  return <section className="min-w-0 rounded-xl border border-border bg-card p-5">
    {canEdit && !editing ? <InlineEditTrigger label={title} onEdit={() => onEdit(section)}><h2 className="font-semibold">{title}</h2></InlineEditTrigger> : <h2 className="font-semibold">{title}</h2>}
    {editing ? <div className="mt-3"><ContactProfileEditor key={`${section}-${editorProps.profile?.id || 'new'}`} section={section} embedded {...editorProps} /></div> : <ContactInlineEditContext.Provider value={{section,editorProps,canEdit}}><div className="mt-3 space-y-3 text-sm">{children}</div></ContactInlineEditContext.Provider>}
  </section>;
}