import React, { useMemo } from "react";
import ProjectCashFlow from '@/components/projects/ProjectCashFlow';
import { useFinanceData } from './finance/useFinanceData';
import { commercialSummary, commercialHealth, commercialAlerts, commercialMilestones, consultantFees, retentionInfo } from './finance/financeCalculations';
import CommercialSummary from './finance/CommercialSummary';
import ValuationPosition from './finance/ValuationPosition';
import VariationsSummary from './finance/VariationsSummary';
import ProfessionalFees from './finance/ProfessionalFees';
import RetentionSummary from './finance/RetentionSummary';
import CommercialMilestones from './finance/CommercialMilestones';
import CommercialAlerts from './finance/CommercialAlerts';
import FinanceInsight from '@/components/alice/FinanceInsight';
import FinanceComingSoon from '@/components/projects/FinanceComingSoon';
import useProjectFinanceOrders from '@/components/projects/finance/useProjectFinanceOrders';
import ProjectSyncedPurchaseOrders from '@/components/projects/finance/ProjectSyncedPurchaseOrders';
import useProjectOrderCashFlow from '@/components/projects/finance/useProjectOrderCashFlow';
import useProjectClientContingency from '@/components/projects/finance/useProjectClientContingency';
import useProjectRiskScores from '@/components/projects/finance/useProjectRiskScores';
import riskScoreAllowance from '@/components/projects/finance/riskScoreAllowance';
import FinanceBalances from '@/components/finance/FinanceBalances';
import '@/components/projects/finance/project-balance-report.css';

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
    </div>
  );
}

export function ProjectFinanceTab({ project }) {
  const fin = useFinanceData(project);
  const contingency = useProjectClientContingency(project.id);
  const riskScores = useProjectRiskScores(project.id);
  const syncedOrders = useProjectFinanceOrders(project);
  const salesOrders = useProjectFinanceOrders(project, 'SO');
  const orderCashFlow = useProjectOrderCashFlow(project, syncedOrders.enabled);
  const pos = syncedOrders.data?.items || [];
  const delivery = fin.deliveries?.[0];
  const riskEstimate = useMemo(() => ({ ...riskScoreAllowance(contingency.error ? null : contingency.data ?? null, riskScores.error ? null : riskScores.data), contingency: contingency.error ? null : contingency.data ?? null }), [contingency.data, contingency.error, riskScores.data, riskScores.error]);
  const summary = useMemo(() => commercialSummary(delivery, fin.decisions || [], fin.valuations || [], riskEstimate), [delivery, fin.decisions, fin.valuations, riskEstimate]);
  const health = useMemo(() => {const result= commercialHealth(summary, fin.valuations || [], null);return {...result,status:result.status==='healthy'?'watch':result.status,factors:[...result.factors,{label:'The Power BI order model does not supply payment receipts; cash balance is not confirmed.',level:'watch'}]};}, [summary, fin.valuations]);
  const consultants = useMemo(() => consultantFees(delivery), [delivery]);
  const alerts = useMemo(() => commercialAlerts(summary, fin.valuations || [], pos, project, consultants), [summary, fin.valuations, pos, project, consultants]);
  const milestones = useMemo(() => commercialMilestones(project, fin.feeProposals || [], pos, fin.jcts || [], fin.valuations || [], delivery), [project, fin.feeProposals, pos, fin.jcts, fin.valuations, delivery]);
  const retention = useMemo(() => retentionInfo(fin.valuations || [], project), [fin.valuations, project]);

  if (fin.loading || contingency.isPending || riskScores.isPending || (syncedOrders.enabled && syncedOrders.isPending) || (salesOrders.enabled && salesOrders.isPending)) return <FinanceComingSoon><Spinner /></FinanceComingSoon>;

  return (
    <FinanceComingSoon>
    <div className="ws-subsection ws-finance space-y-6">
      <div className="ws-panelhead"><h2 className="ws-sectiontitle">Finance</h2></div>
      <FinanceInsight project={project} summary={summary} health={health} delivery={delivery} />
      {contingency.error && <p role="alert" className="text-sm text-destructive">Unable to load Client contingency from the fee proposal.</p>}
      {riskScores.error && <p role="alert" className="text-sm text-destructive">Unable to calculate risk allowance: {riskScores.error.message}<button type="button" className="ml-2 underline" disabled={riskScores.isFetching} onClick={() => riskScores.refetch()}>Try again</button></p>}
      <CommercialSummary summary={summary} health={health} projectId={project.id} />

      <ProjectCashFlow entries={orderCashFlow.data?.entries || []} powerBI
        loading={syncedOrders.enabled && orderCashFlow.isPending}
        error={orderCashFlow.error ? `Power BI purchase-order graph could not be loaded: ${orderCashFlow.error.message}` : ''}
        dueDateFallback={orderCashFlow.data?.dueDateFallback || 0}
        forecast={orderCashFlow.data?.forecast}
        missingDates={orderCashFlow.data?.missingDates || 0} missingValues={orderCashFlow.data?.missingValues || 0} />

        {syncedOrders.enabled && <div className="project-balance-report"><FinanceBalances key={project.id} project={project}/></div>}
        
        <ValuationPosition project={project} valuations={fin.valuations || []} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          {syncedOrders.enabled && syncedOrders.error && <p role="alert" className="rounded-panel border border-border bg-card p-4 text-sm text-destructive">Synced purchase orders could not be loaded: {syncedOrders.error.message}<button type="button" className="ml-2 underline" onClick={()=>syncedOrders.refetch()}>Try again</button></p>}
          {syncedOrders.data && <ProjectSyncedPurchaseOrders project={project} orders={syncedOrders}/>}
        </div>
        <div className="min-w-0">
          {salesOrders.error && <p role="alert" className="text-sm text-destructive">Power BI sales orders could not be loaded: {salesOrders.error.message}<button type="button" className="ml-2 underline" onClick={()=>salesOrders.refetch()}>Try again</button></p>}
          {salesOrders.data && <ProjectSyncedPurchaseOrders project={project} orders={salesOrders} type="SO"/>}
        </div>
      </div>

      <VariationsSummary project={project} decisions={fin.decisions || []} />

      <ProfessionalFees project={project} consultants={consultants} currentContractValue={summary.currentContractValue} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RetentionSummary project={project} retention={retention} />
        <CommercialMilestones milestones={milestones} />
      </div>

      <CommercialAlerts alerts={alerts} />

      <p className="text-sm text-muted-foreground">PO/SO figures and payment dates come from the Power BI model. The chart uses paid dates first, falling back to due dates for expected payments. Sales orders and due dates are not evidence of payment.</p>
    </div>
    </FinanceComingSoon>
  );
}

export default ProjectFinanceTab;