import React from 'react';
import {Check,Circle} from 'lucide-react';
import agreementNames from '@/components/projects/agreementNames';
export default function FrameworkMilestoneTrail({row}) {
 const number=row.project_number || String(row.framework_ref || '').replace(/^FW[34]\s*/i,'').replace(/[a-z]+$/i,'');
 const names=agreementNames(number);
 const recorded=[['Project Questionnaire',!!row.pq_date],[names.access,!!row.aa_signed],[names.development,!!row.calloff_date],['Finish',[row.completed_on_time,row.completed_to_budget,row.zero_riddor].some(v=>['Y','N'].includes(v))]];
 const lastComplete=recorded.reduce((last,[,complete],index)=>complete ? index : last,-1);
 const stages=recorded.map(([label],index)=>[label,index<=lastComplete]);
 const current=stages.findIndex(([,complete])=>!complete);
 return <ol className="flex min-w-96 items-start">{stages.map(([label,complete],i)=><li key={label} className="relative flex flex-1 flex-col items-center gap-2 text-center">{i<3 && <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-px w-full bg-border"/>}<span aria-label={`${label}: ${complete ? 'Complete' : i===current ? 'Current, not recorded' : 'Not reached'}`} title={`${label}: ${complete ? 'Complete' : i===current ? 'Current, not recorded' : 'Not reached'}`} className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border ${complete ? 'border-als-navy bg-als-navy text-sidebar-foreground' : i===current ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>{complete ? <Check className="h-3 w-3"/> : <Circle className="h-2 w-2"/>}</span><span className="max-w-32 px-2 text-[10px] leading-tight text-muted-foreground">{label}</span></li>)}</ol>;
}