import React, { useEffect, useState } from 'react';
import fullName from '@/components/data/fullName';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/portal';
import { STAGES, chance, updateCRMOpportunity } from '@/components/crm/crm';
import { Button } from '@/components/ui/button';
const columns = STAGES.filter(s => !['on_hold','won','lost'].includes(s.value));
export default function CRMPipeline() {
  const { user } = useAuth();
  const [cards, setCards] = useState({}), [pages, setPages] = useState({}), [totals, setTotals] = useState({}), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const editable = ['admin','director','bdm','bsm'].includes(user?.role);
  const query = stage => stage === 'lead' ? { status: 'open', $or: [{ stage: 'lead' }, { stage: { $exists: false } }] } : { status: 'open', stage };
  const load = async () => { setLoading(true); try {
    const [results, aggregate, leadAggregate] = await Promise.all([Promise.all(columns.map(s => base44.entities.Opportunity.filter(query(s.value), { sort: '-created_date', limit: 30 }))), base44.entities.Opportunity.aggregate({ query: { status: 'open' }, groupBy: 'stage', sum: ['budget','weighted_value'] }), base44.entities.Opportunity.aggregate({ query: query('lead'), sum: ['budget','weighted_value'] })]);
    setCards(Object.fromEntries(columns.map((s,i) => [s.value, results[i].items.filter(o => (o.stage || 'lead') === s.value)])));
    setPages(Object.fromEntries(columns.map((s,i) => [s.value, results[i]])));
    const sums = {}; (aggregate.rows || []).forEach(row => { if (row.stage) sums[row.stage] = { count: row.count, budget: row.sum_budget || 0, weighted: row.sum_weighted_value || 0 }; });
    const lead = leadAggregate.rows?.[0]; sums.lead = { count: lead?.count || 0, budget: lead?.sum_budget || 0, weighted: lead?.sum_weighted_value || 0 }; setTotals(sums);
  } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const more = async stage => { try { const page = await base44.entities.Opportunity.filter(query(stage), { sort: '-created_date', limit: 30, cursor: pages[stage].next_cursor }); setCards(old => ({ ...old, [stage]: [...(old[stage] || []), ...page.items.filter(o => (o.stage || 'lead') === stage)] })); setPages(old => ({ ...old, [stage]: page })); } catch (e) { setError(e.message); } };
  const move = async result => { if (!result.destination || result.source.droppableId === result.destination.droppableId || !editable) return; const source = result.source.droppableId, target = result.destination.droppableId, item = cards[source]?.[result.source.index]; if (!item) return; setBusy(true); setError(''); try { await updateCRMOpportunity(item, { stage: target }, user); await load(); } catch (e) { setError(e.message); await load(); } finally { setBusy(false); } };
  return <div className="space-y-4"><div><h1 className="font-heading text-2xl font-semibold">Opportunity pipeline</h1><p className="text-sm text-muted-foreground">Drag cards to move between stages; won and lost outcomes are recorded inside the opportunity.</p></div>{error && <p role="alert" className="text-destructive">{error}</p>}{loading && !Object.keys(cards).length ? <p>Loading pipeline…</p> : <DragDropContext onDragEnd={move}><div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{columns.map(stage => <div key={stage.value} className="min-w-0 rounded-xl border border-border bg-muted/50 p-3"><div className="mb-3"><h2 className="text-sm font-semibold">{stage.label} <span className="text-muted-foreground">({totals[stage.value]?.count || 0})</span></h2><p className="text-xs text-muted-foreground">{formatCurrency(totals[stage.value]?.budget)} · weighted {formatCurrency(totals[stage.value]?.weighted)}</p></div><Droppable droppableId={stage.value} isDropDisabled={!editable || busy}>{provided => <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-20 space-y-2">{(cards[stage.value] || []).map((o,index) => <Draggable key={o.id} draggableId={o.id} index={index} isDragDisabled={!editable || busy}>{drag => <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="min-w-0 break-words rounded-lg border border-border bg-card p-3 shadow-sm"><Link to={`/opportunities/${o.id}`} className="text-sm font-semibold text-primary hover:underline">{o.title}</Link><p className="mt-1 text-xs text-muted-foreground">{o.owner_id ? fullName(o.owner_name,o.owner_id) : 'Unassigned'} · {chance(o)}%</p><p className="mt-1 text-sm">{formatCurrency(o.budget)}</p><p className="text-xs text-muted-foreground">Decision: {o.expected_decision_date || '—'}</p></div>}</Draggable>)}{provided.placeholder}</div>}</Droppable>{pages[stage.value]?.has_more && <Button className="mt-2 w-full" variant="outline" size="sm" onClick={() => more(stage.value)}>Load more</Button>}</div>)}</div></DragDropContext>}</div>;
}