import React from 'react';
import { useOutletContext } from 'react-router-dom';
import CommercialSkeleton from '@/components/finance/CommercialSkeleton';
import { useQuery } from '@tanstack/react-query';

import FinanceDashboardContent from '@/components/finance/FinanceDashboardContent';
import CommercialIEFinance from '@/components/finance/CommercialIEFinance';
import CommercialPipelineFigure from '@/components/finance/CommercialPipelineFigure';
import useCommercialScope from '@/components/finance/useCommercialScope';
import FinanceForecast from '@/components/finance/FinanceForecast.jsx';
import { financeCall } from '@/components/finance/financeClient';
import '@/components/finance/finance-briefing.css';
export default function FinanceDashboard(){
 const {status:q}=useOutletContext(),scope=useCommercialScope(),pipeline=useQuery({queryKey:['finance','pipeline',scope],queryFn:()=>financeCall({action:'pipeline'}),staleTime:60000});
 return <div>{q.data&&!q.data.confirmed&&<CommercialIEFinance/>}{q.isPending&&<CommercialSkeleton/>}{q.error&&<p role="alert" className="text-destructive">{q.error.message}</p>}{q.data&&!q.data.confirmed&&<section className="finance-card finance-accent"><h2 className="font-heading text-lg font-semibold">Commercial data is syncing</h2><p className="mt-2 text-sm text-muted-foreground">{q.data.sync?.status==='error'?`Sync paused: ${q.data.sync.error}`:q.data.sync?'The Power BI order import must complete and be activated before its snapshot is published.':'An administrator can import the Power BI semantic model in Reporting setup.'} No provisional or invented figures are displayed.</p></section>}{q.data?.confirmed&&<><FinanceDashboardContent snapshot={q.data.sync?.active_generation} pipeline={pipeline}/></>}{q.data&&!q.data.confirmed&&<><section className="finance-hero" aria-label="Commercial pipeline"><CommercialPipelineFigure query={pipeline}/></section><FinanceForecast/></>}</div>;
}