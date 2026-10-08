import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES, formatDate } from '@/lib/portal';
import FrameworkPhotoGallery from '@/components/framework/FrameworkPhotoGallery';
import UKLFKPIEditor from '@/components/framework/UKLFKPIEditor';
import FrameworkVersionBadge from '@/components/projects/FrameworkVersionBadge';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';

export default function UKLFProjectTab({ projectId, reportId, startEditing = false, onEditDone, onDirectProject }) {
  const { user } = useAuth();
  const internal = INTERNAL_ROLES.includes(user?.role);
  const canEdit = ['admin', 'director', 'bsm', 'bdm'].includes(user?.role);
  const [report, setReport] = useState(null);
  const [directProject, setDirectProject] = useState(false);
  const [defaults, setDefaults] = useState({});
  const [editingKpis, setEditingKpis] = useState(false);
  const cache = useQueryClient();
  const queryKey = ['framework-project-detail', user?.id, user?.role, projectId, reportId];
  const query = useQuery({ queryKey, enabled: !!user?.id && !!(projectId || reportId), ...organisationQueryPolicy, staleTime: 60000, queryFn: async () => {
    const { data } = await base44.functions.invoke('getStakeholderFrameworkReport', reportId ? { reportId } : { projectId });
    if (data.error) throw new Error(data.error);
    return data;
  } });
  useEffect(() => {
    if (!query.data) return;
    setReport(query.data.report); setDefaults(query.data.defaults || {});
    setDirectProject(Boolean(query.data.directProject)); onDirectProject?.(Boolean(query.data.directProject));
  }, [query.data]);
  useEffect(() => { if (internal && startEditing) setEditingKpis(true); }, [internal, startEditing]);
  if (query.isPending) return <p role="status" className="py-8 text-sm text-slate-500">Loading UKLF details…</p>;
  if (query.error) return <p role="alert" className="py-8 text-sm text-destructive">Unable to load UKLF details. <button type="button" className="underline" disabled={query.isFetching} onClick={() => query.refetch()}>Try again</button></p>;
  if (directProject) return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Direct projects are not included in UKLF reporting.</p>;
  if (!report) return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No UKLF record is linked to this project yet.</p>;
  const fields = [
    ['Project questionnaire', report.pq_status], ['Questionnaire date', formatDate(report.pq_date)],
    ['Agreement sent', formatDate(report.aa_sent)], ['Agreement signed', formatDate(report.aa_signed)],
    ['Call-off date', formatDate(report.calloff_date)], ['Completed on time', report.completed_on_time || (internal && defaults.completed_on_time)],
    ['Completed to budget', report.completed_to_budget || (internal && defaults.completed_to_budget)], ['RIDDOR incidents', report.riddor_incidents],
    ['Apprenticeships', report.apprenticeships],
  ];
  return <div className="ws-subsection ws-uklf-tab space-y-6"><div className="ws-card ws-panel"><h2 className="text-lg font-semibold text-als-navy">UKLF · {report.project_number || `FW3 ${report.framework_ref}`} <FrameworkVersionBadge projectNumber={report.project_number || (/^\d+$/.test(report.framework_ref || '') ? `PROJ${report.framework_ref}` : '')} /></h2><p className="text-sm text-slate-500">{report.site || 'Site not recorded'} · {report.client || 'Client not recorded'}</p>{report.project_number && report.framework_ref && !report.project_number.toUpperCase().endsWith(report.framework_ref.toUpperCase()) && <p className="mt-1 text-xs text-slate-500">Original workbook FW3 reference: {report.framework_ref}</p>}</div>
    <RecordUpdatedAt record={report} />
    <div className="ws-uklf"><section className="ws-card ws-panel"><div className="ws-panelhead flex-wrap"><h3 className="ws-sectiontitle">Milestones and delivery KPIs</h3>{internal && !editingKpis && <button type="button" onClick={() => setEditingKpis(true)} className="ws-save">Edit KPIs</button>}</div><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm font-medium text-slate-900">{value === null || value === undefined || value === '' ? '—' : value}</dd></div>)}</dl>{internal && ((defaults.completed_on_time && !report.completed_on_time) || (defaults.completed_to_budget && !report.completed_to_budget)) && <p className="mt-4 text-xs text-muted-foreground">Unrecorded outcomes show suggested defaults. Save KPIs to confirm them.</p>}{internal && editingKpis && <UKLFKPIEditor report={report} defaults={defaults} onSaved={kpis => { setReport(previous => ({ ...previous, ...kpis })); cache.setQueryData(queryKey, previous => previous ? { ...previous, report: { ...previous.report, ...kpis } } : previous); cache.invalidateQueries({ queryKey: ['framework-workspace'] }); setEditingKpis(false); onEditDone?.(); }} onCancel={() => { setEditingKpis(false); onEditDone?.(); }} />}</section>
    </div><FrameworkPhotoGallery reportId={report.id} canEdit={canEdit} />
  </div>;
}