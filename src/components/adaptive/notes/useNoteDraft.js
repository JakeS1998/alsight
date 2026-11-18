import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useNoteDraft(note, userId) {
  const cache = useQueryClient(), [draft, setDraft] = useState(() => ({ title: note.title, body: note.body, body_format: note.body_format ?? 'plain' }));
  const [status, setStatus] = useState('saved');
  const latest = useRef(draft), saved = useRef(draft), timer = useRef(), running = useRef(), deleting = useRef(false);
  function save() {
    clearTimeout(timer.current);
    if (deleting.current || latest.current === saved.current) return running.current;
    if (running.current) return running.current;
    if (latest.current.body.length > 30000) { setStatus('limit'); return; }
    setStatus('saving');
    running.current = (async () => {
      try {
        while (!deleting.current && latest.current !== saved.current) {
          const pending = latest.current;
          if (pending.body.length > 30000) { setStatus('limit'); return; }
          const updated = await base44.entities.PersonalNote.update(note.id, pending);
          saved.current = pending;
          cache.setQueryData(['my-note', userId, note.id], updated);
        }
        cache.invalidateQueries({ queryKey: ['my-notes', userId] });
        setStatus('saved');
      } catch {
        setStatus('error');
      } finally { running.current = null; }
    })();
    return running.current;
  }
  useEffect(() => () => { save(); }, []);
  function change(patch) {
    latest.current = { ...latest.current, ...patch };
    setDraft(latest.current);
    setStatus('pending');
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 600);
  }
  async function remove() {
    deleting.current = true;
    clearTimeout(timer.current);
    await running.current;
    try { await base44.entities.PersonalNote.delete(note.id); }
    catch (error) { deleting.current = false; save(); throw error; }
  }
  async function move(sectionId) {
    await save();
    if (latest.current !== saved.current) throw new Error('Unsaved note');
    const updated = await base44.entities.PersonalNote.update(note.id, { section_id: sectionId });
    cache.setQueryData(['my-note', userId, note.id], updated);
  }
  return { draft, status, change, save, remove, move };
}