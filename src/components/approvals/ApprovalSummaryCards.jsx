import React from 'react';
import KpiIllustration from '@/components/metrics/KpiIllustration';
import {ClipboardCheck,Check,Files} from 'lucide-react';
export default function ApprovalSummaryCards({summary,view,onView}) {
 const cards=[['pending','Awaiting my approval','Sorted oldest first',ClipboardCheck,summary.data?.pending],['approved','Approved by me','Last 30 days',Check,summary.data?.approved],['all','All approvals','Your authorised approvals',Files,summary.data?.total]];
 return <div className="grid gap-3 sm:grid-cols-3">{cards.map(([key,title,subtitle,Icon,count])=><button key={key} onClick={()=>onView(key)} aria-pressed={view===key} className={`alsight-illustrated-kpi flex items-center gap-4 rounded-lg border bg-card p-4 text-left ${view===key ? 'border-primary/60' : 'border-border'}`}><KpiIllustration label={title}/><span><span className="block text-xl font-bold">{summary.error ? '—' : count ?? '…'}</span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-muted-foreground">{subtitle}</span></span></button>)}</div>;
}