import React from 'react';
import CommercialPageHeader from '@/components/finance/CommercialPageHeader';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import FinanceDashboardContent from '@/components/finance/FinanceDashboardContent';
import CommercialPipelineFigure from '@/components/finance/CommercialPipelineFigure';
import useCommercialScope from '@/components/finance/useCommercialScope';
import FinanceForecast from '@/components/finance/FinanceForecast.jsx';
import { financeCall } from '@/components/finance/financeClient';
import '@/components/finance/finance-briefing.css';
export default function FinanceDashboard(){
 const {user}=useAuth(),scope=useCommercialScope(),pipeline=useQuery({queryKey:['finance','pipeline',scope],queryFn:()=>financeCall({action:'pipeline'}),staleTime:60000}),q=useQuery({queryKey:['finance-status',scope],queryFn:()=>financeCall({action:'status'}),refetchInterval:query=>query.state.data?.sync?.status==='running'?5000:false});
 return <div className="finance-briefing"><CommercialPageHeader status={q.data} user={user}/>{q.isPending&&<p role="status">Checking reporting connection…</p>}{q.error&&<p role="alert" className="text-destructive">{q.error.message}</p>}{q.data&&!q.data.confirmed&&<section className="finance-card finance-accent"><h2 className="font-heading text-lg font-semibold">Commercial data is syncing</h2><p className="mt-2 text-sm text-muted-foreground">{q.data.sync?.status==='error'?`Sync paused: ${q.data.sync.error}`:q.data.sync?'All finance tables must finish before the first snapshot is published.':'An administrator can start the Dataverse finance sync in Reporting setup.'} No provisional or invented figures are displayed.</p></section>}{q.data?.confirmed&&<><FinanceDashboardContent snapshot={q.data.sync?.active_generation} pipeline={pipeline}/></>}{!q.data?.confirmed&&<><section className="finance-hero" aria-label="Commercial pipeline"><CommercialPipelineFigure query={pipeline}/></section><FinanceForecast/></>}</div>;
}