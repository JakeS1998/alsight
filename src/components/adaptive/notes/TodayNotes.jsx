import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotebookPen, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import TodayNoteEditor from '@/components/adaptive/notes/TodayNoteEditor';
import NoteLocation from '@/components/adaptive/notes/NoteLocation';
import NotePages from '@/components/adaptive/notes/NotePages';

export default function TodayNotes({ userId }) {
  const cache = useQueryClient(), [selected, setSelected] = useState(null);
  const [location, setLocation] = useState({ notebook: null, section: null });
  const sectionId = location.section?.id ?? null, canWrite = !location.notebook || !!sectionId;
  const key = ['my-notes', userId, sectionId];
  const notes = useInfiniteQuery({ queryKey: key, enabled: canWrite, initialPageParam: null, queryFn: ({ pageParam }) =>
    base44.entities.PersonalNote.filter({ created_by_id: userId, section_id: sectionId }, { sort: '-updated_date', limit: 25, fields: ['id', 'title', 'updated_date'], ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const create = useMutation({ mutationFn: section => base44.entities.PersonalNote.create({ title: 'Untitled note', body: '', section_id: section }), onSuccess: note => {
    cache.setQueryData(['my-note', userId, note.id], note);
    setSelected({ id: note.id, sectionId: note.section_id ?? null });
    cache.invalidateQueries({ queryKey: ['my-notes', userId, note.section_id ?? null] });
  } });
  const items = notes.data?.pages.flatMap(page => page.items) ?? [];
  const active = !canWrite ? null : selected && selected.sectionId === sectionId ? selected.id : items[0]?.id;
  function changeLocation(next) {
    if (next.notebook?.id !== location.notebook?.id || next.section?.id !== location.section?.id) { setSelected(null); create.reset(); }
    setLocation(next);
  }
  function afterMove(next) {
    setLocation(next);
    setSelected({ id: active, sectionId: next.section?.id ?? null });
    cache.invalidateQueries({ queryKey: ['my-notes', userId] });
  }
  function afterDelete() {
    cache.removeQueries({ queryKey: ['my-note', userId, active] });
    cache.setQueryData(key, data => data && ({ ...data, pages: data.pages.map(page => ({ ...page, items: page.items.filter(note => note.id !== active) })) }));
    setSelected(null);
    cache.invalidateQueries({ queryKey: key });
  }
  return <div className="min-w-0 text-foreground">
    <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><NotebookPen className="text-primary" size={19} aria-hidden="true" />My Notes</h2>
      <Button size="sm" disabled={!canWrite || create.isPending} onClick={() => create.mutate(sectionId)}><Plus />{create.isPending ? 'Creating…' : 'New note'}</Button>
    </header>
    {create.isError && <p role="alert" className="py-2 text-sm text-destructive">Couldn’t create the note. Try again.</p>}
    <div className="grid min-h-96 content-start md:grid-cols-[14rem_minmax(0,1fr)] md:content-stretch">
      <aside aria-label="Note organisation" className="min-w-0 space-y-4 border-b border-border py-4 md:border-b-0 md:border-r md:pr-5">
        <NoteLocation userId={userId} location={location} onChange={changeLocation} editable />
        {canWrite && <NotePages notes={notes} items={items} active={active} onSelect={id => setSelected({ id, sectionId })} />}
      </aside>
      {active ? <TodayNoteEditor key={active} id={active} userId={userId} location={location} onMove={afterMove} onDelete={afterDelete} /> : (!canWrite || !notes.isPending && !notes.isError) && <div className="grid place-content-center gap-2 p-8 text-center"><h3 className="font-semibold">{canWrite ? 'A place for your notes' : 'Open a section'}</h3><p className="text-sm text-muted-foreground">{canWrite ? 'Select New note to start a page.' : 'Choose a section or create one to start adding pages.'}</p></div>}
    </div>
  </div>;
}