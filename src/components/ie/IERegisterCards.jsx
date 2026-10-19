import React from 'react';
import {Link} from 'react-router-dom';
import {Building2,ArrowUpRight} from 'lucide-react';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {IE_SERVICES} from '@/components/ie/ieServices';
import {formatDate} from '@/lib/portal';
import IERecordReference from '@/components/ie/IERecordReference';
export default function IERegisterCards({items=[]}){
 return <div className="ie-engagement-cards">{items.map(item=><Link key={item.id} to={`/insights-engagement/${item.id}`} className="ie-engagement-card"><div className="flex items-center justify-between"><span className="ie-row-thumb"><Building2/></span><StatusBadge status={item.status} map={IE_STATUSES}/></div><h3>{item.name}</h3><p className="break-all text-xs text-muted-foreground"><IERecordReference item={item}/></p><p>{item.client_name}</p><span className="ie-card-service">{IE_SERVICES[item.service]||'Service not set'} · {item.product_name||'Product not set'} · {item.support_type_name||'Support not set'}</span><div className="ie-card-footer"><span>{item.owner_name||'Unassigned'}<small>{item.target_date?formatDate(item.target_date):'No target date'}</small></span><ArrowUpRight/></div></Link>)}{!items.length&&<p className="ie-register-empty">No engagements match these filters.</p>}</div>;
}