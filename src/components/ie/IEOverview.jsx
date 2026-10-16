import React from 'react';
import {CircleAlert, Pencil} from 'lucide-react';
import {Button} from '@/components/ui/button';
import IEEditablePanel from '@/components/ie/IEEditablePanel';
import IEEngagementSummary from '@/components/ie/IEEngagementSummary';
import IEEngagementInformation from '@/components/ie/IEEngagementInformation';
import IEEngagementRecords from '@/components/ie/IEEngagementRecords';
import IEEngagementTeam from '@/components/ie/IEEngagementTeam';
import IEEngagementDates from '@/components/ie/IEEngagementDates';

export default function IEOverview({data,onEdit}){
 const {item,links}=data;
 return <div className="space-y-5">
  {item.awaiting_action&&<section className="flex flex-wrap items-center gap-3 rounded-panel border border-primary/30 bg-primary/10 px-5 py-4" aria-label="Awaiting action"><CircleAlert className="h-5 w-5 shrink-0 text-primary"/><div className="min-w-0 flex-1 basis-64"><h2 className="text-sm font-bold">Awaiting action</h2><p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{item.action_note||'This engagement needs attention.'}</p></div>{data.canEdit&&<Button size="sm" variant="outline" onClick={onEdit}><Pencil/>Review details</Button>}</section>}
  <div className="grid items-stretch gap-5 xl:grid-cols-3"><div className="min-w-0 xl:col-span-2"><IEEngagementSummary item={item} canEdit={data.canEdit}/></div><IEEngagementInformation item={item} canEdit={data.canEdit}/></div>
  <div className="grid items-stretch gap-5 xl:grid-cols-3"><IEEngagementRecords item={item} links={links} canEdit={data.canEdit}/><IEEngagementTeam item={item} canEdit={data.canEdit}/><IEEngagementDates item={item} canEdit={data.canEdit}/></div>
  <IEEditablePanel title="Important notes & risks" section="notes" item={item} canEdit={data.canEdit}><p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{item.notes_risks||'No important notes or risks recorded.'}</p></IEEditablePanel>
 </div>;
}