import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function HandoverPackHeader({ pack, editable, busy, onAction, onRefresh, onDownload }) {
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-3xl font-semibold">{pack.percentage}% <span className="text-sm font-normal text-muted-foreground">dataset complete · {pack.completed} of {pack.required}</span></p><p className="mt-1 text-xs text-muted-foreground">Started by {pack.startedBy} · {new Date(pack.startedAt).toLocaleString('en-GB')}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={onRefresh}><RefreshCw />Recheck</Button><Button variant="outline" disabled={busy} onClick={() => onDownload('pdf')}><Download />PDF report</Button><Button variant="outline" disabled={busy} onClick={() => onDownload('zip')}><Download />Document bundle (ZIP)</Button></div></div>
    <Progress value={pack.percentage} aria-label="Handover dataset completeness" />
    <p className="text-xs text-muted-foreground">Checked {new Date(pack.checkedAt).toLocaleString('en-GB')}. ZIP includes current private documents, the report and a manifest with file integrity hashes; external document links remain references, not copied files. Limits: 10 MB per document, 20 MB per bundle.</p>
    <label className="block text-sm">England golden-thread regime applicability<select disabled={!editable || busy} value={pack.applicability} onChange={event => onAction('applicability', { value: event.target.value }).catch(() => {})} className="ml-0 mt-2 block rounded border border-input bg-background p-2 text-sm sm:ml-3 sm:inline-block"><option value="not_assessed">Not assessed</option><option value="applies">Applies — confirmed by project team</option><option value="does_not_apply">Does not apply — confirmed by project team</option></select></label>
    <p className="text-xs text-muted-foreground">{pack.disclaimer} <a href={pack.guidance} target="_blank" rel="noreferrer" className="underline">BSR guidance</a></p>
  </div>;
}