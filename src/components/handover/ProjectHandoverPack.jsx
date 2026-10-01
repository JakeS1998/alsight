import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import useHandoverPack from '@/components/handover/useHandoverPack';
import HandoverPackHeader from '@/components/handover/HandoverPackHeader';
import HandoverItem from '@/components/handover/HandoverItem';
import { FormSection } from '@/components/forms/PowerForm';

export default function ProjectHandoverPack({ project, savingDelivery, onStarted }) {
  const { user } = useAuth();
  const enabled = ['admin','director','regional_director','bdm','bsm','finance'].includes(user?.role);
  const editable = ['admin','director','bdm','bsm'].includes(user?.role);
  const handover = useHandoverPack(project.id, savingDelivery, onStarted, enabled);
  if (!enabled) return null;
  const { pack, busy, error, load, action, download } = handover;
  return <FormSection title="Project handover pack" description="Structured close-out evidence, review status and document versions. Save close-out changes above to include them in the pack.">
    <div className="space-y-4">
    {error && <div role="alert" className="text-sm text-destructive">{error}<button type="button" onClick={load} disabled={busy} className="ml-2 underline">Retry / recheck</button></div>}
    {busy && <p role="status" className="text-sm text-muted-foreground">Updating / preparing handover pack…</p>}
    {!pack?.started ? <div className="space-y-3"><p className="text-sm text-muted-foreground">Handover has not started. Starting it checks the saved close-out data and linked warranties without changing project completion status.</p>{editable && <Button disabled={busy || savingDelivery} onClick={() => action('start').catch(() => {})}>Start handover</Button>}{!editable && <p className="text-sm text-muted-foreground">An administrator, director, BDM or BSM can start handover.</p>}</div> : <>
      <HandoverPackHeader pack={pack} authorised={['admin','director'].includes(user?.role)} editable={editable} busy={busy || savingDelivery} onAction={action} onRefresh={load} onDownload={download} />
      <div className="space-y-2">{pack.items.map(item => <HandoverItem key={item.key} projectId={project.id} item={item} authorised={['admin','director'].includes(user?.role)} editable={editable} busy={busy || savingDelivery} onAction={action} />)}</div>
      <p className="text-xs text-muted-foreground">Evidence uploads are private; superseded versions remain available for traceability and are excluded from the current bundle.</p>
      {!!pack.audit.length && <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm font-medium">Change history ({pack.audit.length})</summary><div className="mt-3 max-h-64 overflow-y-auto space-y-2">{[...pack.audit].reverse().map((event, index) => <p key={index} className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString('en-GB')} · {event.actor} · {event.action}{event.key ? ` · ${event.key}` : ''}</p>)}</div></details>}
    </>}
    </div>
  </FormSection>;
}