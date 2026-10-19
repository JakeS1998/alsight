import React from 'react';
import IEEditablePanel from '@/components/ie/IEEditablePanel';
import IEEditableField from '@/components/ie/IEEditableField';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {regionName} from '@/components/ie/ieRegions';
import {IE_SERVICES} from '@/components/ie/ieServices';

export default function IEEngagementInformation({item,canEdit}){
 const fields=[['Engagement owner',item.owner_name||'Unassigned','owner_id'],['Service',IE_SERVICES[item.service],'service'],['Product',item.product_name,'product_id'],['Support type',item.support_type_name,'support_type_id'],['Region',regionName(item.region_id),'region_id'],['Priority',item.priority?.replaceAll('_',' '),'priority'],['Sites',(item.sites||[]).join(', '),'sites']];
 return <IEEditablePanel title="Key information" section="information" item={item} canEdit={canEdit} className="h-full"><dl className="space-y-4 text-sm">
  {fields.map(([label,value,field])=><div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`break-words text-xs font-semibold ${label==='Priority'?'capitalize':''}`}><IEEditableField field={field} label={label}>{value||'Not recorded'}</IEEditableField></dd></div>)}
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-4 border-t border-border pt-4"><dt className="text-xs text-muted-foreground">Status</dt><dd><IEEditableField field="status" label="Status"><StatusBadge status={item.status} map={IE_STATUSES}/></IEEditableField></dd></div>
 </dl></IEEditablePanel>;
}