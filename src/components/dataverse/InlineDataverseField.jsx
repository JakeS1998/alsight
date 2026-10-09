import React, { useContext } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataverseEditContext from '@/components/dataverse/DataverseEditContext';
import inlineFieldName from '@/components/dataverse/inlineFieldNames';
import useInlineDataverseField from '@/components/dataverse/useInlineDataverseField';
import FlowFieldInput from '@/components/dataverse/FlowFieldInput';
export default function InlineDataverseField({ field, label, children }) {
  const context = useContext(DataverseEditContext);
  const name = field || inlineFieldName(context?.table, label);
  const edit = useInlineDataverseField(context, name);
  const approvalOnly = ['documents', 'dma', 'warranties'].includes(context?.table) && ['approval_status', 'approvers_name', 'approval_comments', 'approval_date'].includes(name);
  if (approvalOnly || !context?.mappedFields.includes(name)) return children;
  const title = label || name.replaceAll('_', ' ');
  return <div className="min-w-0 text-left" onClick={event => event.stopPropagation()}>
    {edit.open ? <div className="min-w-0 space-y-2">
      {edit.field && <FlowFieldInput field={edit.field} label={title} hideLabel value={edit.value} onChange={edit.setValue} disabled={Boolean(edit.busy)} />}
      <div className="flex flex-wrap items-center gap-1">
        {edit.field ? <Button type="button" size="sm" disabled={Boolean(edit.busy) || !edit.changed} onClick={edit.save} aria-label={`Save ${title}`}><Check />Save</Button> : !edit.busy && <Button type="button" size="sm" variant="outline" onClick={edit.start}>Retry loading field</Button>}
        <Button type="button" variant="ghost" size="sm" disabled={Boolean(edit.busy)} onClick={edit.cancel} aria-label={`Cancel editing ${title}`}><X />Cancel</Button>
      </div>
    </div> : <div className="flex items-center gap-1"><div className="min-w-0 flex-1">{children}</div><Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`Edit ${title}`} title={`Edit ${title}`} onClick={edit.start} disabled={Boolean(edit.busy)}><Pencil className="h-3.5 w-3.5" /></Button></div>}
    {edit.busy && <p role="status" className="text-xs text-muted-foreground">{edit.busy === 'save' ? 'Saving to Dataverse…' : 'Loading latest field…'}</p>}
    {edit.error && <p role="alert" className="text-xs text-destructive">{edit.error}</p>}
    {edit.notice && <p role="status" className="text-xs text-muted-foreground">{edit.notice}</p>}
  </div>;
}