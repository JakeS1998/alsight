import React,{useState} from 'react';
import {Reply} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent} from '@/components/forms/form-dialog';
import NetworxEmailComposer from '@/components/networx/NetworxEmailComposer';
export default function NetworxEmailReplyButton({entity,recordId,emailId}) {
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 return <><Button type="button" size="sm" variant="outline" onClick={()=>setOpen(true)}><Reply className="h-4 w-4"/>Reply</Button><Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value);}}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">{open && <NetworxEmailComposer entity={entity} recordId={recordId} replyToId={emailId} onBusyChange={setBusy} onClose={()=>setOpen(false)}/>}</DialogContent></Dialog></>;
}