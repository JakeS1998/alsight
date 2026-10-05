import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import ProjectRiskTracker from '@/components/dashboard/ProjectRiskTracker';
import { useAuth } from '@/lib/AuthContext';
import useAssignedTasks from '@/components/tasks/useAssignedTasks';
import AssignedTaskRows from '@/components/tasks/AssignedTaskRows';

export default function DashboardAttention({ portfolio, riskExpanded, onRiskExpandedChange }) {
  const { user } = useAuth();
  const tasks = useAssignedTasks(user);
  const cutoff = Date.now() - 14 * 86400000;
  const projectIds = new Set(portfolio.pipeline.map(p => p.id));
  const alerts = portfolio.fees.filter(f => projectIds.has(f.project_id) && ['sent', 'internal_review'].includes(f.status) && f.updated_date && new Date(f.updated_date).getTime() < cutoff).map(f => ({ id: `fee-${f.id}`, projectId: f.project_id, title: portfolio.pipeline.find(p => p.id === f.project_id)?.name || 'Fee proposal', reason: `Fee proposal ${f.status === 'sent' ? 'awaiting client response' : 'awaiting internal review'} for over 14 days`, priority: 1 }));
  return <section className="min-w-0 rounded-xl border border-border bg-card p-4" id="dashboard-attention">
    <h2 className="font-heading text-base font-semibold text-als-navy">Attention required</h2>
    {portfolio.atRisk.length > 0 && <div className="mt-4"><ProjectRiskTracker atRisk={portfolio.atRisk} expanded={riskExpanded} onExpandedChange={onRiskExpandedChange} /></div>}
    <h3 className="mt-4 text-sm font-medium text-foreground">Assigned to me{tasks.total ? ` (${tasks.total})` : ''}</h3>
    <AssignedTaskRows tasks={tasks} />
    {!tasks.loading && !tasks.error && !tasks.total && !alerts.length && !portfolio.atRisk.length ? <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No priority actions currently require your attention.</p> : alerts.length > 0 && <div className="mt-3 divide-y divide-slate-100">{alerts.map(alert => <Link key={alert.id} to={`/projects/${alert.projectId}?tab=delivery`} className="flex items-start gap-3 py-3 text-sm hover:bg-slate-50"><AlertTriangle className={alert.priority ? 'mt-0.5 h-4 w-4 shrink-0 text-amber-600' : 'mt-0.5 h-4 w-4 shrink-0 text-rose-600'} /><span><strong className="font-medium text-slate-900">{alert.title}</strong><span className="block text-xs text-slate-600">{alert.reason}</span></span></Link>)}</div>}
  </section>;
}