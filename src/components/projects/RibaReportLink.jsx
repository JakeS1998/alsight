import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileCheck } from 'lucide-react';

export default function RibaReportLink({ project, onProjectUpdated }) {
  const { user } = useAuth();
  const canEdit = ['admin', 'director', 'bdm'].includes(user?.role);
  const [link, setLink] = useState(project.link_to_riba4_report || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setLink(project.link_to_riba4_report || ''); setMessage(''); }, [project.id, project.link_to_riba4_report]);
  const save = async event => {
    event.preventDefault(); setMessage('');
    const value = link.trim();
    if (value) {
      let url;
      try { url = new URL(value); } catch { setMessage('Enter a valid SharePoint link.'); return; }
      if (url.protocol !== 'https:' || !/(^|\.)sharepoint\.(com|us|de|cn)$/.test(url.hostname)) { setMessage('Enter an HTTPS SharePoint link.'); return; }
    }
    setSaving(true);
    try {
      const updated = await base44.entities.Project.update(project.id, { link_to_riba4_report: value });
      onProjectUpdated?.(updated); setLink(value); setMessage('Link saved.');
    } catch { setMessage('Unable to save the link. Please try again.'); }
    finally { setSaving(false); }
  };
  if (project.link_to_riba4_report) return <a href={project.link_to_riba4_report} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
    <div className="flex min-w-0 items-center gap-3"><FileCheck className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-sm font-semibold text-foreground">RIBA 4 report</p><p className="text-xs text-muted-foreground">Open document in SharePoint</p></div></div>
    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
  </a>;
  return <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    {canEdit && <form onSubmit={save} className="space-y-2">
      <label htmlFor={`riba4-link-${project.id}`} className="block text-xs text-muted-foreground">SharePoint link</label>
      <div className="flex flex-wrap gap-2"><input id={`riba4-link-${project.id}`} type="url" value={link} onChange={e => { setLink(e.target.value); setMessage(''); }} disabled={saving} placeholder="https://yourorganisation.sharepoint.com/..." className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save Link'}</Button></div>
      {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
    </form>}
    {!canEdit && <p className="text-xs text-muted-foreground">No RIBA 4 report linked yet.</p>}
  </div>;
}