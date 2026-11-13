import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import FlowRecordEditor from '@/components/dataverse/FlowRecordEditor';
export default function BsmRecordFields({table,recordId,onSaved}){
 const [open,setOpen]=useState(false);
 return <div className="mt-4 space-y-3"><Button type="button" variant="outline" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'Close field editor':'Edit permitted record fields'}</Button>{open&&<><p className="text-xs text-muted-foreground">Changes use your connected Microsoft account and existing project access. Approval-controlled and Microsoft read-only fields remain protected.</p><FlowRecordEditor table={table} recordId={recordId} writableOnly onSaved={onSaved}/></>}</div>;
}