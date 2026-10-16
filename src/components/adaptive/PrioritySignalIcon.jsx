import React from 'react';
import { AlertTriangle, Clock3, FileText, ShieldCheck, ClipboardCheck } from 'lucide-react';
export default function PrioritySignalIcon({item}) {
 const Icon=item.category==='documents'?FileText:item.category==='compliance'?ShieldCheck:item.level==='Urgent'?AlertTriangle:item.level==='Upcoming'?Clock3:ClipboardCheck;
 return <Icon size={20} aria-hidden="true"/>;
}