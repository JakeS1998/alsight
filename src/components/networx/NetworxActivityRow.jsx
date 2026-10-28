import React, { useState } from 'react';
import { CalendarDays, CheckSquare, ChevronDown, FileText, Mail, Phone } from 'lucide-react';
import { formatDateTime } from '@/lib/portal';
import NetworxActivityDetail from '@/components/networx/NetworxActivityDetail';
const kinds = {email:{label:'Email',icon:Mail},appointment:{label:'Meeting',icon:CalendarDays},phonecall:{label:'Phone call',icon:Phone},task:{label:'Task',icon:CheckSquare},annotation:{label:'Note',icon:FileText}};
export default function NetworxActivityRow({ row, entity, recordId, user }) {
  const [open,setOpen] = useState(false), kind = kinds[row.kind] || kinds.annotation, Icon = kind.icon;
  return <li className="overflow-hidden rounded-panel border border-border bg-card">
    <button type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
      <span className="rounded-md bg-secondary p-2 text-foreground"><Icon className="h-4 w-4"/></span>
      <span className="min-w-0 flex-1 space-y-1"><span className="block break-words text-sm font-semibold">{row.subject}</span><span className="block text-xs text-muted-foreground">{kind.label}{row.status && ` · ${row.status}`}{row.owner && ` · ${row.owner}`}</span><span className="block text-xs text-muted-foreground">Updated {formatDateTime(row.updated)}</span>{row.occurred && <span className="block text-xs text-muted-foreground">When: {formatDateTime(row.occurred)}{row.end ? ` to ${formatDateTime(row.end)}` : ''}</span>}{row.filename && <span className="block break-words text-xs text-muted-foreground">{row.filename}</span>}</span>
      <ChevronDown className={open ? 'h-4 w-4 shrink-0 rotate-180 text-muted-foreground' : 'h-4 w-4 shrink-0 text-muted-foreground'}/>
    </button>
    {open && <NetworxActivityDetail row={row} entity={entity} recordId={recordId} user={user}/>}
  </li>;
}