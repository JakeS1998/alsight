import React from 'react';
import {Link} from 'react-router-dom';
import {Building2,ExternalLink,FolderKanban,Lightbulb} from 'lucide-react';
import IEEditablePanel from '@/components/ie/IEEditablePanel';
import IEEditableField from '@/components/ie/IEEditableField';

export default function IEEngagementRecords({item,links={},canEdit}){
 const records=[[Building2,'Client',item.client_name,links.client&&item.client_id?`/accounts/${item.client_id}`:null],[FolderKanban,'Project',item.project_name,links.project&&item.project_id?`/projects/${item.project_id}`:null],[Lightbulb,'Opportunity',item.opportunity_name,links.opportunity&&item.opportunity_id?`/opportunities/${item.opportunity_id}`:null]];
 return <IEEditablePanel title="Related records" section="records" item={item} canEdit={canEdit} className="h-full"><dl className="space-y-5">
  {records.map(([Icon,label,name,to])=><div key={label} className="flex items-start gap-3"><span className="rounded-md bg-secondary p-2 text-als-navy"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-xs font-semibold"><IEEditableField field={`${label.toLowerCase()}_id`} label={label}>{to?<Link to={to} className="flex items-start justify-between gap-3 hover:underline">{name||label}<ExternalLink className="h-3.5 w-3.5 shrink-0"/></Link>:name||'Not linked'}</IEEditableField></dd></div></div>)}
 </dl></IEEditablePanel>;
}