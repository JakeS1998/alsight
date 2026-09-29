import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, regionName } from '@/lib/portal';
import { nextStageDate, projectStage, STAGES } from '@/components/dashboard/pipelineStage';

export default function PipelineTimelineDetail({ selection, projects, accountMap }) {
  const rows = selection === 'total' ? projects : projects.filter(p => projectStage(p) === selection);
  const value = rows.reduce((sum, p) => sum + (Number(p.estimated_value) || 0), 0);
  return <div className="border-t border-slate-200 px-5 py-5" id="pipeline-timeline-detail">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-als-navy">{selection === 'total' ? 'Pipeline total' : selection} details</h3><Link to="/projects" className="text-sm font-medium text-als-navy underline-offset-2 hover:underline">View all projects →</Link></div>
    {selection === 'total' && <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600"><span>{rows.length} active projects</span><span>{formatCurrency(value)} estimated</span><span>{formatCurrency(rows.length ? value / rows.length : 0)} average</span><span>{rows.filter(p => p.live_project).length} live · {rows.filter(p => !p.live_project).length} on hold</span><span>{STAGES.map(stage => `${stage}: ${rows.filter(p => projectStage(p) === stage).length}`).join(' · ')}</span></div>}
    {!rows.length ? <p className="mt-4 text-sm text-slate-500">No projects at this stage.</p> : <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-auto">
      {[...rows].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || ''))).map(p => <Link key={p.id} to={`/projects/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:bg-slate-50">
        <div className="min-w-0"><p className="font-medium text-slate-900">{p.name} <span className="font-normal text-slate-500">{p.project_number}</span></p><p className="text-xs text-slate-500">{accountMap[p.client_account_id]?.name || p.client_name || 'Client not recorded'} · {regionName(p.department_id) || 'Region not recorded'} · {projectStage(p)} · {p.live_project ? 'Live' : 'On hold'}</p></div>
        <div className="text-right"><p className="font-medium text-slate-800">{formatCurrency(p.estimated_value)}</p><p className="text-xs text-slate-500">Next stage date: {formatDate(nextStageDate(p, projectStage(p)))}</p></div>
      </Link>)}
    </div>}
  </div>;
}