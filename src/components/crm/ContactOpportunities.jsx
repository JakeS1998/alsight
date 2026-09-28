import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/portal';
import { Button } from '@/components/ui/button';

export default function ContactOpportunities({ contactId }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async (next = null) => {
    setLoading(true);
    try {
      const page = await base44.entities.Opportunity.filter({ contact_id: contactId }, { sort: '-created_date', limit: 50, ...(next ? { cursor: next } : {}) });
      setItems(old => next ? [...old, ...page.items] : page.items); setCursor(page.next_cursor); setHasMore(page.has_more);
    } catch (e) { setError(e.message || 'Unable to load opportunities.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [contactId]);
  return <section className="space-y-3"><h2 className="font-semibold">Linked opportunities</h2>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{loading && !items.length ? <p className="text-sm text-muted-foreground">Loading opportunities…</p> : !items.length ? <p className="text-sm text-muted-foreground">No opportunities linked to this contact.</p> : items.map(item => <div key={item.id} className="rounded-xl border border-border bg-card p-4 text-sm"><div className="flex justify-between gap-2"><strong>{item.title}</strong><span className="capitalize">{item.status}</span></div>{item.budget != null && <p>Budget: {formatCurrency(item.budget)}</p>}{item.project_id ? <Link className="text-primary hover:underline" to={`/projects/${item.project_id}`}>View project</Link> : <Link className="text-primary hover:underline" to={`/accounts/${item.account_id}#crm`}>View account CRM</Link>}</div>)}{hasMore && <Button variant="outline" disabled={loading} onClick={() => load(cursor)}>{loading ? 'Loading…' : 'Load more'}</Button>}</section>;
}