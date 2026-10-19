import React, { useState } from 'react';
import useRememberedPages from '@/components/navigation/useRememberedPages';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { isoToday, logCRMActivity } from '@/components/crm/crm';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
export default function CRMTasks() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false), [actionError, setError] = useState('');
  const {rows,cursor,more,loading,load,error:readError}=useRememberedPages('tasks',next=>base44.entities.CRMTask.filter({ status: { $in: ['open','in_progress'] } }, { sort: 'due_date', limit: 50, ...(next ? { cursor: next } : {}) }));
  const error=actionError || readError;
  const complete = async task => { setBusy(true); setError(''); try { await base44.entities.CRMTask.update(task.id, { status: 'completed', completed_at: new Date().toISOString() }); const opportunity = await base44.entities.Opportunity.get(task.opportunity_id); if (opportunity) await logCRMActivity(opportunity, user, 'task_completed', `Task completed: ${task.title}`); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <div className="space-y-4" aria-busy={loading}><Button asChild variant="outline"><Link to="/opportunities">Back to live opportunities</Link></Button><h1 className="font-heading text-2xl font-semibold">Pipeline tasks</h1>{error && <p role="alert" className="text-destructive">{error}</p>}{loading && !rows.length ? <p>Loading tasks…</p> : !rows.length ? <p className="text-muted-foreground">No open tasks for you or your direct reports.</p> : <div className="space-y-2">{rows.map(task => <div key={task.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"><div className="min-w-0 flex-1"><p className="font-medium">{task.title}</p><RecordUpdatedAt record={task} className="mt-1" /><Link className="text-xs text-primary hover:underline" to={`/opportunities/${task.opportunity_id}`}>Open opportunity</Link></div><span className={task.due_date && task.due_date < isoToday() ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'}>{task.due_date || 'No due date'}</span><span className="text-sm capitalize text-muted-foreground">{task.priority}</span><Button disabled={busy} size="sm" variant="outline" onClick={() => complete(task)}>Complete</Button></div>)}</div>}{more && <Button variant="outline" disabled={loading} onClick={() => load(cursor)}>Load more</Button>}</div>;
}