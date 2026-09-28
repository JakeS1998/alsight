import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/portal';
import { Button } from '@/components/ui/button';
export default function ContactProjects({ contact }) {
  const [rows, setRows] = useState([]), [cursor, setCursor] = useState(null), [more, setMore] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const ids = [contact.id, contact.dataverse_id].filter(Boolean);
  const query = { $or: ['client_rep_id','client_rep2_id','project_manager_id','contractor_contact_id'].map(key => ({ [key]: { $in: ids } })) };
  const load = async (next = null) => { setLoading(true); try { const page = await base44.entities.Project.filter(query, { sort: '-created_date', limit: 20, ...(next ? { cursor: next } : {}) }); setRows(old => next ? [...old,...page.items] : page.items); setCursor(page.next_cursor); setMore(page.has_more); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [contact.id]);
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Linked projects</h2>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{loading && !rows.length ? <p className="mt-3 text-sm text-muted-foreground">Loading projects…</p> : !rows.length ? <p className="mt-3 text-sm text-muted-foreground">No directly linked projects found.</p> : <ul className="mt-3 divide-y divide-border">{rows.map(p => <li key={p.id} className="py-2 text-sm"><Link to={`/projects/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link><p className="text-xs text-muted-foreground">{p.live_project ? 'Live' : 'On Hold'} · {p.project_manager_id && ids.includes(p.project_manager_id) ? 'Project manager' : p.contractor_contact_id && ids.includes(p.contractor_contact_id) ? 'Contractor contact' : 'Client representative'} · {p.estimated_value != null ? formatCurrency(p.estimated_value) : 'Value not recorded'}</p></li>)}</ul>}{more && <Button size="sm" variant="outline" onClick={() => load(cursor)} disabled={loading}>Load more</Button>}</section>;
}