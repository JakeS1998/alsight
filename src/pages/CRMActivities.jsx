import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import ReminderSetter from '@/components/crm/ReminderSetter';
export default function CRMActivities() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]), [cursor, setCursor] = useState(null), [more, setMore] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = async (next = null) => { setLoading(true); try { const page = await base44.entities.CRMActivity.filter({}, { sort: '-occurred_at', limit: 50, ...(next ? { cursor: next } : {}) }); setRows(old => next ? [...old, ...page.items] : page.items); setCursor(page.next_cursor); setMore(page.has_more); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <div className="space-y-4"><h1 className="font-heading text-2xl font-semibold">CRM activity</h1>{error && <p role="alert" className="text-destructive">{error}</p>}{loading && !rows.length ? <p>Loading activity…</p> : !rows.length ? <p className="text-muted-foreground">No CRM activity recorded yet.</p> : <div className="space-y-2">{rows.map(row => <div key={row.id} className="rounded-xl border border-border bg-card p-4"><Link to={`/opportunities/${row.opportunity_id}`} className="font-medium text-primary hover:underline">{row.subject}</Link><p className="text-xs capitalize text-muted-foreground">{row.type?.replaceAll('_',' ')} · {new Date(row.occurred_at).toLocaleString('en-GB')} · {row.author_name}</p>{row.description && <p className="mt-1 whitespace-pre-wrap text-sm">{row.description}</p>}<ReminderSetter activity={row} opportunityId={row.opportunity_id} user={user} /></div>)}</div>}{more && <Button variant="outline" disabled={loading} onClick={() => load(cursor)}>Load more</Button>}</div>;
}