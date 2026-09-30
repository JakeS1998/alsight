import React from 'react';
import { Button } from '@/components/ui/button';
import HandoverRegisterFields from '@/components/handover/HandoverRegisterFields';
import HandoverRegisterRows from '@/components/handover/HandoverRegisterRows';
import useHandoverRegister from '@/components/handover/useHandoverRegister';
const buildable = ['om','hs','warranties','training','assets','defects','final_account'];
export default function HandoverRegisterBuilder({ projectId, item, editable, busy, onAction, expanded }) {
  const { config, draft, setDraft, loading, error, save, download } = useHandoverRegister(projectId, item.key, expanded && buildable.includes(item.key), onAction);
  if (!buildable.includes(item.key)) return <p className="text-xs text-muted-foreground">{item.key === 'pc' ? 'Upload the certificate issued by the certifier; this portal does not issue PC certificates.' : item.key === 'as_builts' ? 'Upload the issued as-built drawings; this portal is not a drawing-authoring tool.' : 'Upload or securely reference the actual issued information / certificate. This portal does not issue statutory certificates.'}</p>;
  const disabled = loading || busy;
  return <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
    <div><h3 className="text-sm font-semibold">{config?.label || `${item.label} register`}</h3>{item.register_version > 0 && <p className="mt-1 text-xs text-muted-foreground">Version {item.register_version} · {item.register_count} entries · {item.register_saved_by} · {new Date(item.register_saved_at).toLocaleString('en-GB')}</p>}</div>
    {loading && !config && <p role="status" className="text-sm">Loading register…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {config && <form className="space-y-4" onSubmit={event => { event.preventDefault(); save(); }}>
      <p className="text-xs text-muted-foreground">{config.guidance || 'Complete the handover register below. Save changes before reviewing completion.'} Saving sets the item to partial until its completion is reviewed.</p>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto overscroll-contain pr-2">
        {!!config.summary?.length && <HandoverRegisterFields fields={config.summary} values={draft.summary} disabled={disabled || !editable} onChange={(key, value) => setDraft(old => ({ ...old, summary: { ...old.summary, [key]: value } }))} />}
        <HandoverRegisterRows fields={config.fields} rows={draft.rows} editable={editable} disabled={disabled} onChange={rows => setDraft(old => ({ ...old, rows }))} />
      </div>
      <div className="flex flex-wrap gap-2">{editable && <Button type="submit" disabled={disabled}>{loading ? 'Saving…' : 'Save register'}</Button>}{item.register_version > 0 && <Button type="button" variant="outline" disabled={disabled} onClick={download}>Download saved PDF</Button>}</div>
    </form>}
  </div>;
}