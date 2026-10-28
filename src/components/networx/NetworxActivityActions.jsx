import React,{useState} from 'react';
import {Phone,Video,MapPin,Plus,ChevronDown} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent} from '@/components/forms/form-dialog';
import NetworxActivityComposer from '@/components/networx/NetworxActivityComposer';
export default function NetworxActivityActions({entity,recordId}) {
 const [kind,setKind]=useState(null),[busy,setBusy]=useState(false);
 return <><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4"/>Add activity<ChevronDown className="h-3.5 w-3.5"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>setKind('teams')}><Video className="mr-2 h-4 w-4"/>Teams meeting</DropdownMenuItem><DropdownMenuItem onSelect={()=>setKind('in_person')}><MapPin className="mr-2 h-4 w-4"/>In-person meeting</DropdownMenuItem><DropdownMenuItem onSelect={()=>setKind('call')}><Phone className="mr-2 h-4 w-4"/>Log a phone call</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Dialog open={Boolean(kind)} onOpenChange={open=>{if(!open && !busy)setKind(null);}}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">{kind && <NetworxActivityComposer key={kind} entity={entity} recordId={recordId} kind={kind} onBusyChange={setBusy} onClose={()=>setKind(null)}/>}</DialogContent></Dialog></>;
}