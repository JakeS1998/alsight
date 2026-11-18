import React from 'react';
import NoteGroupPicker from '@/components/adaptive/notes/NoteGroupPicker';

export default function NoteLocation({ userId, location, onChange, editable = false }) {
  const { notebook, section } = location;
  return <div className="space-y-3">
    <NoteGroupPicker kind="notebook" userId={userId} value={notebook} editable={editable} onSelect={next => onChange({ notebook: next, section: notebook?.id === next?.id ? section : null })} />
    {notebook && <NoteGroupPicker key={notebook.id} kind="section" notebookId={notebook.id} userId={userId} value={section} editable={editable} onSelect={next => onChange({ notebook, section: next })} />}
  </div>;
}