import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
export default function DataQualityDuplicateGroup({ item, onEdit }) {
  const [open, setOpen] = useState(false), [rows, setRows] = useState([]), [cursor, setCursor] = useState(null), [more, setMore] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const load = async next => {
    setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('getDataQuality', { action: 'duplicate_records', email: item.email, ...(next ? { cursor: next } : {}) });
      if (data.error) throw new Error(data.error);
      setRows(old => next ? [...old, ...data.items] : data.items); setCursor(data.next_cursor); setMore(data.has_more);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (open) load(); }, [open, item.email]);
  return <><Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>Edit contacts</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Duplicate group · {item.email}</DialogTitle></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{rows.map(row => <div key={row.id} className="flex items-center justify-between gap-3 border-b border-border py-2"><span className="text-sm">{row.full_name || row.id}</span><Button size="sm" variant="outline" onClick={() => { setOpen(false); onEdit({ recordId: row.id, entity: 'Contact', label: row.full_name || row.id }); }}>Edit</Button></div>)}{busy && <p role="status" className="text-sm">Loading contacts…</p>}{!busy && !rows.length && <p className="text-sm text-muted-foreground">No active contacts in this group.</p>}{more && <Button variant="outline" disabled={busy} onClick={() => load(cursor)}>Load more contacts</Button>}</DialogContent></Dialog></>;
}