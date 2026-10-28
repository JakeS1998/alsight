import React,{useState} from 'react';
import {Phone,Video,MapPin} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent} from '@/components/forms/form-dialog';
import NetworxActivityComposer from '@/components/networx/NetworxActivityComposer';
export default function NetworxActivityActions({entity,recordId}) {
 const [kind,setKind]=useState(null),[busy,setBusy]=useState(false);
 return <><Button type="button" size="sm" variant="outline" onClick={()=>setKind('teams')}><Video className="h-4 w-4"/>Teams meeting</Button><Button type="button" size="sm" variant="outline" onClick={()=>setKind('in_person')}><MapPin className="h-4 w-4"/>In-person meeting</Button><Button type="button" size="sm" variant="outline" onClick={()=>setKind('call')}><Phone className="h-4 w-4"/>Log call</Button><Dialog open={Boolean(kind)} onOpenChange={open=>{if(!open && !busy)setKind(null);}}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">{kind && <NetworxActivityComposer key={kind} entity={entity} recordId={recordId} kind={kind} onBusyChange={setBusy} onClose={()=>setKind(null)}/>}</DialogContent></Dialog></>;
}