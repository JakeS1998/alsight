import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Pencil, Users, CalendarDays} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {formatDate} from '@/lib/portal';
import IERecordReference from '@/components/ie/IERecordReference';
export default function IEProjectHeader({item,canEdit,onEdit}) {
 return <header className="rounded-panel border border-border bg-card p-5 sm:p-6">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><Link to="/insights-engagement" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={15}/>Insights &amp; Engagement</Link><span className="text-xs text-muted-foreground"><IERecordReference item={item}/></span></div>
  <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span>{item.client_name}</span><StatusBadge status={item.status} map={IE_STATUSES}/></div><h1 className="break-words font-heading text-2xl font-bold text-foreground sm:text-3xl">{item.name}</h1></div>{canEdit&&<Button size="sm" variant="outline" onClick={onEdit}><Pencil/>Edit project</Button>}</div>
  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><Users size={14}/>{item.owner_name||'No project owner'}</span><span className="inline-flex items-center gap-2"><CalendarDays size={14}/>Target: {item.target_date?formatDate(item.target_date):'Not set'}</span></div>
 </header>;
}