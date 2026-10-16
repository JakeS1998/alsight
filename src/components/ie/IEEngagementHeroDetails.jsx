import React from 'react';
import {Building2,Layers,Tag,UserRound,MapPin,CalendarDays,Flag} from 'lucide-react';
import {formatDate} from '@/lib/portal';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import {IE_SERVICES} from '@/components/ie/ieServices';
export default function IEEngagementHeroDetails({item}){
 const details=[[Building2,'Client',item.client_name||'Client not linked'],[Layers,'Service',IE_SERVICES[item.service]||'Not recorded'],[Tag,'Product',item.product_name||'Not recorded'],[Tag,'Support',item.support_type_name||'Not recorded'],[UserRound,'Responsible SAM',item.owner_name||'Unassigned'],[MapPin,'Sites',item.sites?.join(', ')||'Not recorded'],[CalendarDays,'Start',item.start_date?formatDate(item.start_date):'Not recorded'],[Flag,'Target',item.target_date?formatDate(item.target_date):'Not recorded']];
 return <div className="ws-hero-details"><div className="ws-hero-details-inner">
  <dl className="ie-hero-record-details">{details.map(([Icon,label,value])=><div key={label} className="min-w-0"><dt className="flex items-center gap-1.5 text-xs text-sidebar-foreground/65"><Icon className="h-3.5 w-3.5 shrink-0"/>{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-sidebar-foreground">{value}</dd></div>)}</dl>
  <RecordUpdatedAt record={item} className="mt-4 text-sidebar-foreground/70"/>
 </div></div>;
}