import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/forms/form-dialog';
import NetworxEmailComposer from '@/components/networx/NetworxEmailComposer';
export default function NetworxEmailButton({entity,recordId}) {
  const [open,setOpen] = useState(false), [busy,setBusy] = useState(false);
  return <>
    <Button type="button" size="sm" onClick={()=>setOpen(true)}><Mail className="h-4 w-4"/>New email</Button>
    <Dialog open={open} onOpenChange={value=>{if (!busy) setOpen(value);}}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
      {open && <NetworxEmailComposer entity={entity} recordId={recordId} onBusyChange={setBusy} onClose={()=>setOpen(false)}/>}
    </DialogContent></Dialog>
  </>;
}