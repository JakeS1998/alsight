import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Pencil} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import IEEngagementPhoto from '@/components/ie/IEEngagementPhoto';
import IEEngagementHeroDetails from '@/components/ie/IEEngagementHeroDetails';

export default function IEEngagementHeader({item,canEdit,onEdit}) {
 return <>
  <div className="ws-topline flex-wrap justify-between">
   <Link to="/insights-engagement" className="ws-back"><ArrowLeft size={18}/>Back to I &amp; E</Link>
   <div className="flex flex-wrap items-center gap-4"><span className="break-all text-xs">{item.project_number||item.reference}</span>{canEdit&&<Button variant="outline" size="sm" onClick={onEdit}><Pencil/>Edit engagement</Button>}</div>
  </div>
  <header className="ws-hero ie-record-header">
   <IEEngagementPhoto item={item}/>
   <div className="ws-herotext">
    <div className="ws-eyebrow">Insights &amp; Engagement</div>
    <h1 className="ws-title">{item.name}</h1>
    <div className="ws-meta mb-5"><StatusBadge status={item.status} map={IE_STATUSES}/><span className="ws-pill">{item.project_number||item.reference}</span></div>
    <IEEngagementHeroDetails item={item}/>
   </div>
  </header>
 </>;
}