import React from 'react';
import IEPanel from '@/components/ie/IEPanel';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {regionName} from '@/lib/portal';

export default function IEEngagementInformation({item}){
 const fields=[['Engagement owner',item.owner_name||'Unassigned'],['Service',item.category_name],['Support type',item.support_type_name],['Region',regionName(item.region_id)],['Priority',item.priority?.replaceAll('_',' ')],['Sites',(item.sites||[]).join(', ')]];
 return <IEPanel title="Key information" className="h-full"><dl className="space-y-4 text-sm">
  {fields.map(([label,value])=><div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`break-words text-xs font-semibold ${label==='Priority'?'capitalize':''}`}>{value||'Not recorded'}</dd></div>)}
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-4 border-t border-border pt-4"><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusBadge status={item.status} map={IE_STATUSES}/></dd></div>
 </dl></IEPanel>;
}