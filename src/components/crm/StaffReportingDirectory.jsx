import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function StaffReportingDirectory({ revision, onUpdated }) {
  const [lines, setLines] = useState([]), [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = async () => {
    const [page, response] = await Promise.all([base44.entities.StaffReportingLine.filter({}, { sort: 'staff_name', limit: 50 }), base44.functions.invoke('assignPipelineManager', { action: 'list' })]);
    setLines(page.items); setUsers(response.data.users);
  };
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, [revision]);
  const byEmail = new Map(users.filter(u => u.email).map(u => [u.email.trim().toLowerCase(), u]));
  const personFor = email => byEmail.get(email?.trim().toLowerCase());
  const ready = lines.filter(line => line.source_matched && line.manager_aad_id && personFor(line.staff_email) && personFor(line.manager_email) && personFor(line.staff_email).line_manager_id !== personFor(line.manager_email).id);
  const sync = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      for (const line of ready) await base44.functions.invoke('assignPipelineManager', { employeeId: personFor(line.staff_email).id, managerId: personFor(line.manager_email).id });
      await load(); onUpdated?.(); setNotice(`Linked ${ready.length} portal reporting line${ready.length === 1 ? '' : 's'}.`);
    } catch (e) { await load(); setError(e.response?.data?.error || e.message || 'Unable to link reporting lines.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">SystemUsers reporting lines</h2><p className="text-sm text-muted-foreground">Imported managers are matched by staff identity. Pipeline access links only when both people have portal accounts.</p></div><Button type="button" disabled={loading || busy || !ready.length} onClick={sync}>{busy ? 'Linking…' : `Link portal accounts (${ready.length})`}</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm">{notice}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading staff…</p> : !lines.length ? <p className="text-sm text-muted-foreground">No imported staff reporting lines yet.</p> : <div className="divide-y divide-border">{lines.map(line => <div key={line.id} className="grid gap-1 py-3 text-sm sm:grid-cols-3"><span className="font-medium">{line.staff_name}</span><span>{!line.source_matched ? 'Source match needs review' : line.manager_name || 'No manager in export'}</span><span className="text-muted-foreground">{personFor(line.staff_email) ? line.manager_aad_id ? personFor(line.manager_email) ? 'Both have portal access' : 'Manager awaiting portal access' : 'Portal account active' : 'Staff awaiting portal access'}</span></div>)}</div>}
  </section>;
}