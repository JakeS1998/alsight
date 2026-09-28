import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false), [rows, setRows] = useState([]), [due, setDue] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const root = useRef(null);
  const refresh = async () => {
    try {
      const q = { user_id: user.id, dismissed_at: { $exists: false } };
      const [page, count] = await Promise.all([base44.entities.CRMReminder.filter(q, { sort: 'remind_at', limit: 50 }), base44.entities.CRMReminder.count({ ...q, remind_at: { $lte: new Date().toISOString() } })]);
      setRows(page.items); setDue(count); setError('');
    } catch (e) { setError(e.message || 'Unable to load reminders.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!user?.id) return;
    refresh();
    const timer = setInterval(refresh, 60000);
    const unsubscribe = base44.entities.CRMReminder.subscribe(() => refresh());
    return () => { clearInterval(timer); unsubscribe(); };
  }, [user?.id]);
  useEffect(() => { if (!open) return; const close = e => { if (!root.current?.contains(e.target)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [open]);
  const dismiss = async row => {
    try { await base44.entities.CRMReminder.update(row.id, { dismissed_at: new Date().toISOString() }); await refresh(); }
    catch (e) { setError(e.message || 'Unable to dismiss reminder.'); }
  };
  return <div ref={root} className="relative ml-auto shrink-0 xl:ml-0">
    <button type="button" aria-label={`Notifications${due ? `, ${due} due` : ''}`} aria-expanded={open} onClick={() => { setOpen(v => !v); refresh(); }} className="relative rounded-lg p-2 text-white/75 hover:bg-white/10 hover:text-white"><Bell className="h-5 w-5" />{due > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-bold text-primary-foreground">{due > 99 ? '99+' : due}</span>}</button>
    {open && <div className="absolute right-0 top-full z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl"><h2 className="font-semibold">Reminders</h2>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}{loading ? <p className="mt-3 text-sm text-muted-foreground">Loading reminders…</p> : !rows.length ? <p className="mt-3 text-sm text-muted-foreground">No reminders set.</p> : <ul className="mt-3 max-h-80 divide-y divide-border overflow-y-auto">{rows.map(row => <li key={row.id} className="py-3 text-sm"><Link onClick={() => setOpen(false)} to={`/opportunities/${row.opportunity_id}`} className="block break-words font-medium text-primary hover:underline">{row.subject}</Link><p className="text-xs text-muted-foreground">{new Date(row.remind_at).toLocaleString('en-GB')} · {row.remind_at <= new Date().toISOString() ? 'Due' : 'Upcoming'}</p><button type="button" onClick={() => dismiss(row)} className="mt-1 text-xs text-muted-foreground underline hover:text-foreground">Dismiss</button></li>)}</ul>}</div>}
  </div>;
}