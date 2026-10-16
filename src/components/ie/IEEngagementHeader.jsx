import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Building2, Layers, Pencil, Tag} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';

export default function IEEngagementHeader({item,canEdit,onEdit}) {
 return <>
  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
   <Link to="/insights-engagement" className="inline-flex items-center gap-2 font-semibold hover:text-foreground"><ArrowLeft className="h-4 w-4"/>Back to I &amp; E</Link>
   <span className="break-all">{item.reference}</span>
  </div>
  <header className="ie-record-header rounded-panel border border-border bg-card px-5 py-5 text-card-foreground sm:px-7">
   <div className="flex flex-wrap items-center gap-4">
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-als-navy" aria-hidden="true"><Building2 className="h-8 w-8" strokeWidth={1.5}/></div>
    <div className="min-w-0 flex-1 basis-64">
     <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Insights &amp; Engagement</div>
     <div className="flex flex-wrap items-center gap-3"><h1 className="break-words font-heading text-xl font-bold leading-tight sm:text-2xl">{item.name}</h1><StatusBadge status={item.status} map={IE_STATUSES}/></div>
     <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {[[Building2,item.client_name||'Client not linked'],[Layers,item.category_name||'Service not recorded'],[Tag,item.support_type_name||'Support type not recorded']].map(([Icon,label],i)=><span key={i} className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 shrink-0"/>{label}</span>)}
     </div>
    </div>
    <div className="flex flex-col items-end gap-3">{canEdit&&<Button variant="outline" size="sm" onClick={onEdit}><Pencil/>Edit engagement</Button>}<RecordUpdatedAt record={item}/></div>
   </div>
  </header>
 </>;
}