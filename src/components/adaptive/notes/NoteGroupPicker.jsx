import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NoteGroupPicker({ kind, notebookId, userId, value, onSelect, editable }) {
  const cache = useQueryClient(), [mode, setMode] = useState(null), [name, setName] = useState('');
  const parent = kind === 'section' ? { notebook_id: notebookId } : {};
  const key = ['my-note-groups', userId, kind, notebookId ?? null];
  const groups = useInfiniteQuery({ queryKey: key, initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.PersonalNoteGroup.filter({ created_by_id: userId, kind, ...parent }, { sort: 'name', limit: 30, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const save = useMutation({ mutationFn: () => mode === 'rename' ? base44.entities.PersonalNoteGroup.update(value.id, { name: name.trim() }) : base44.entities.PersonalNoteGroup.create({ kind, ...parent, name: name.trim() }),
    onSuccess: group => { onSelect(group); cache.invalidateQueries({ queryKey: key }); setMode(null); } });
  const items = groups.data?.pages.flatMap(page => page.items) ?? [];
  const options = value && !items.some(group => group.id === value.id) ? [value, ...items] : items;
  function start(next) { save.reset(); setName(next === 'rename' ? value.name : ''); setMode(next); }
  return <div className="min-w-0 space-y-2">
    <label className="block text-xs font-semibold capitalize">{kind}
      <select className={`mt-1 block h-9 w-full rounded-md border border-input px-2 text-sm font-normal ${editable ? 'bg-background text-foreground' : 'bg-card text-card-foreground'}`} value={value?.id ?? ''} disabled={save.isPending || (groups.isPending && !value)} onChange={e => { setMode(null); onSelect(options.find(group => group.id === e.target.value) ?? null); }}>
        <option value="" disabled={kind === 'section'}>{groups.isPending ? 'Loading…' : kind === 'notebook' ? 'Unfiled notes' : 'Choose a section'}</option>
        {options.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select>
    </label>
    {groups.isError && <div role="alert" className="text-xs">Couldn’t load {kind}s. <button type="button" className="underline" onClick={() => groups.refetch()}>Retry</button></div>}
    {!mode && <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {editable && <button type="button" className="underline" onClick={() => start('new')}>New {kind}</button>}
      {editable && value && <button type="button" className="underline" onClick={() => start('rename')}>Rename</button>}
      {groups.hasNextPage && <button type="button" className="underline" disabled={groups.isFetchingNextPage} onClick={() => groups.fetchNextPage()}>{groups.isFetchingNextPage ? 'Loading…' : `More ${kind}s`}</button>}
    </div>}
    {mode && <form className="space-y-2" onSubmit={e => { e.preventDefault(); if (name.trim() && !save.isPending) save.mutate(); }}>
      <Input autoFocus aria-label={`${kind} name`} placeholder={`${kind === 'notebook' ? 'Notebook' : 'Section'} name`} maxLength={100} value={name} disabled={save.isPending} onChange={e => setName(e.target.value)} />
      <div className="flex gap-2"><Button size="sm" type="submit" disabled={!name.trim() || save.isPending}>{save.isPending ? 'Saving…' : mode === 'rename' ? 'Save name' : 'Create'}</Button><Button size="sm" type="button" variant="ghost" disabled={save.isPending} onClick={() => setMode(null)}>Cancel</Button></div>
      {save.isError && <p role="alert" className="text-xs text-destructive">Couldn’t save this {kind}. Try again.</p>}
    </form>}
  </div>;
}