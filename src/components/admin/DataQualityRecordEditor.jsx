import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DataQualityEditorField from '@/components/admin/DataQualityEditorField';
import useDataQualityEditor from '@/components/admin/useDataQualityEditor';
export default function DataQualityRecordEditor({ target, check, onClose, onSaved }) {
  const { editor, values, setValues, busy, error, save } = useDataQualityEditor(target, check, onSaved, onClose);
  return <Dialog open={!!target} onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
    <DialogHeader><DialogTitle>Edit data · {target?.label}</DialogTitle></DialogHeader>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {busy && !editor && <p role="status" className="text-sm text-muted-foreground">Loading record…</p>}
    {editor && <form className="flex min-h-0 flex-col gap-4" onSubmit={save}>
      <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-2"><p className="text-sm text-muted-foreground">{editor.description}</p><div className="grid gap-4 sm:grid-cols-2">{editor.fields.map(field => <DataQualityEditorField key={field.key} field={field} value={values[field.key]} disabled={busy || (check === 'jct' && !!values.existing_jct_id && field.key !== 'existing_jct_id')} onChange={value => setValues(old => ({ ...old, [field.key]: value }))} />)}</div></div>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save and recheck'}</Button></DialogFooter>
    </form>}
  </DialogContent></Dialog>;
}