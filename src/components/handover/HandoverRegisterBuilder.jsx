import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import HandoverRegisterFields from '@/components/handover/HandoverRegisterFields';
import HandoverRegisterRows from '@/components/handover/HandoverRegisterRows';
import useHandoverRegister from '@/components/handover/useHandoverRegister';
const buildable = ['om','hs','warranties','training','assets','defects','final_account'];
export default function HandoverRegisterBuilder({ projectId, item, editable, busy, onAction }) {
  const [open, setOpen] = useState(false);
  const { config, draft, setDraft, loading, error, save, download } = useHandoverRegister(projectId, item.key, open, onAction);
  if (!buildable.includes(item.key)) return <p className="text-xs text-muted-foreground">{item.key === 'pc' ? 'Upload the certificate issued by the certifier; this portal does not issue PC certificates.' : 'Upload the issued as-built drawings; this portal is not a drawing-authoring tool.'}</p>;
  const disabled = loading || busy;
  return <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
    <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen(true)}>{editable ? item.register_version ? 'Edit portal register' : 'Build in portal' : 'View portal register'}</Button>{item.register_version > 0 && <span className="text-xs text-muted-foreground">Version {item.register_version} · {item.register_count} entries · {item.register_saved_by} · {new Date(item.register_saved_at).toLocaleString('en-GB')}</span>}</div>
    <Dialog open={open} onOpenChange={value => { if (!disabled) setOpen(value); }}><DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-4xl">
      <DialogHeader><DialogTitle>{config?.label || item.label}</DialogTitle></DialogHeader>
      {loading && !config && <p role="status" className="text-sm">Loading register…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {config && <form className="flex min-h-0 flex-col gap-4" onSubmit={async event => { event.preventDefault(); if (await save()) setOpen(false); }}>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-2">
          <p className="text-xs text-muted-foreground">{config.guidance || 'Build a structured handover record. Save changes before reviewing completion.'} Saving sets the item to partial until its completion is reviewed.</p>
          {!!config.summary?.length && <HandoverRegisterFields fields={config.summary} values={draft.summary} disabled={disabled || !editable} onChange={(key, value) => setDraft(old => ({ ...old, summary: { ...old.summary, [key]: value } }))} />}
          <HandoverRegisterRows fields={config.fields} rows={draft.rows} editable={editable} disabled={disabled} onChange={rows => setDraft(old => ({ ...old, rows }))} />
        </div>
        <DialogFooter className="shrink-0 flex-wrap gap-2"><Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(false)}>Close</Button>{item.register_version > 0 && <Button type="button" variant="outline" disabled={disabled} onClick={download}>Download saved PDF</Button>}{editable && <Button type="submit" disabled={disabled}>{loading ? 'Saving…' : 'Save register'}</Button>}</DialogFooter>
      </form>}
    </DialogContent></Dialog>
  </div>;
}