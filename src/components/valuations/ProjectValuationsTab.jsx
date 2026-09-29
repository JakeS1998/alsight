import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';
import { useAuth } from '@/lib/AuthContext';
import ValuationDashboard from './ValuationDashboard';
import ValuationRegister from './ValuationRegister';
import ValuationDetail from './ValuationDetail';

export default function ProjectValuationsTab({ project }) {
  const { user } = useAuth();
  const [valuations, setValuations] = useState([]); const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [meta, setMeta] = useState({});
  useEffect(() => { let active = true; setLoading(true); Promise.all([['project_manager', 'supplier'].includes(user?.role) ? base44.functions.invoke('manageValuation', { action: 'list', projectId: project.id }).then(res => res.data.valuations) : filterAll(base44.entities.Valuation, { project_id: project.id }), base44.functions.invoke('manageValuation', { action: 'meta', projectId: project.id })]).then(([rows, response]) => { if (active) { setValuations(rows); setMeta(response.data.meta || {}); const id = new URLSearchParams(window.location.search).get('valuation'); if (id) setSelected(rows.find(v => v.id === id) || null); } }).catch(err => { if (active) setError(err.response?.data?.error || err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [project.id]);
  const onAction = async (action, data = {}, valuationId) => { const res = await base44.functions.invoke('manageValuation', { action, projectId: project.id, valuationId, ...data }); const valuation = res.data.valuation; setValuations(rows => [valuation, ...rows.filter(v => v.id !== valuation.id)]); return valuation; };
  const create = async () => { setBusy(true); setError(''); try { const created = await onAction('create'); setSelected(created); } catch(err) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); } };
  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading valuations…</p>;
  const canCreate = user?.role === 'admin' || (user?.role === 'supplier' && !!project.can_submit_valuation) || (user?.role === 'project_manager' && !!project.project_manager_id && project.project_manager_id === (user.contact_dataverse_id || user.data?.contact_dataverse_id));
  return selected ? <ValuationDetail key={selected.id} project={project} initial={selected} valuations={valuations} user={user} onAction={onAction} onBack={() => setSelected(null)} managerName={meta.manager_name || (user?.role === 'project_manager' ? user.full_name : '')} contractorName={meta.contractor_name} meta={meta} /> : <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold text-als-navy">Valuations</h2><p className="text-sm text-muted-foreground">Construction valuations for this project</p></div>{canCreate && <button disabled={busy} onClick={create} className="rounded-lg bg-als-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Creating…' : '+ New Valuation'}</button>}</div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<ValuationDashboard project={project} valuations={valuations} meta={meta} /><ValuationRegister valuations={valuations} onOpen={setSelected} /></div>;
}