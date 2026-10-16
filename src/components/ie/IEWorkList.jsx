import React from 'react';
import {Link} from 'react-router-dom';
import {Building2,CheckCircle2} from 'lucide-react';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {formatDate} from '@/lib/portal';
export default function IEWorkList({items=[],empty='No engagements to show.',activity=false,attention=false}){
 const today=new Date().toISOString().slice(0,10);
 return <div className="ie-work-list">{items.map(item=>{
  const overdue=item.target_date&&item.target_date<today&&!['completed','cancelled'].includes(item.status);
  return <Link key={item.id} to={`/insights-engagement/${item.id}`} className="ie-work-row"><span className="ie-work-thumb"><Building2 strokeWidth={1.5}/></span><span className="ie-work-copy"><strong>{item.name}</strong><span>{item.client_name}</span>{attention&&item.action_note&&<span className="ie-work-note" title={item.action_note}>{item.action_note}</span>}</span><span className="ie-work-state">{attention?<span className={`ie-attention-badge ${overdue?'ie-overdue':''}`}>{overdue?'Overdue':item.awaiting_action?'Action needed':'Due soon'}</span>:<StatusBadge status={item.status} map={IE_STATUSES}/>}</span><span className="ie-work-date">{activity?formatDate(item.updated_date):item.target_date?formatDate(item.target_date):'No target'}</span></Link>;
 })}{!items.length&&<div className="ie-work-empty"><CheckCircle2/><p>{empty}</p></div>}</div>;
}