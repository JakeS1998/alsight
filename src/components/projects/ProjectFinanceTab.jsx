import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { loadProjectPOs, isLegacyProject } from '@/components/projects/poLinking';
import { formatCurrency } from "@/lib/portal";
import ProjectCashFlow, { useProjectCashFlow } from '@/components/projects/ProjectCashFlow';
import InvoiceReceipts from '@/components/projects/InvoiceReceipts';
import { useFinanceData } from './finance/useFinanceData';
import { commercialSummary, commercialHealth, commercialAlerts, commercialMilestones, consultantFees, retentionInfo } from './finance/financeCalculations';
import CommercialSummary from './finance/CommercialSummary';
import ValuationPosition from './finance/ValuationPosition';
import FinancePurchaseOrders from './finance/FinancePurchaseOrders';
import VariationsSummary from './finance/VariationsSummary';
import ProfessionalFees from './finance/ProfessionalFees';
import RetentionSummary from './finance/RetentionSummary';
import CommercialMilestones from './finance/CommercialMilestones';
import CommercialAlerts from './finance/CommercialAlerts';

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
    </div>
  );
}

export function ProjectFinanceTab({ project }) {
  const [pos, setPos] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const cashFlow = useProjectCashFlow(project.id);
  const fin = useFinanceData(project);

  useEffect(() => {
    (async () => {
      try {
        const [poData, liData, glData, custData, accData] = await Promise.all([
          loadProjectPOs(project).catch(() => []),
          listAll(base44.entities.PurchaseOrderLineItem).catch(() => []),
          listAll(base44.entities.GLCode, "-name").catch(() => []),
          listAll(base44.entities.Customer, "-name").catch(() => []),
          listAll(base44.entities.Account, "-name").catch(() => []),
        ]);
        setPos(poData);
        setLineItems(liData);
        setGlCodes(glData);
        setCustomers(custData);
        setAccounts(accData);
      } finally {
        setLoading(false);
      }
    })();
  }, [project.id]);

  const supplierMap = useMemo(() => {
    const m = {};
    accounts.forEach((a) => { if (a.company_number) m[a.company_number] = a.name; });
    customers.forEach((c) => { if (c.company_number) m[c.company_number] = c.name; });
    return m;
  }, [accounts, customers]);

  const poIds = useMemo(() => new Set(pos.map((p) => p.dataverse_id)), [pos]);
  const projectLineItems = useMemo(() => lineItems.filter((li) => poIds.has(li.po_id)), [lineItems, poIds]);
  const lineItemsByPo = useMemo(() => {
    const m = {};
    projectLineItems.forEach((li) => { (m[li.po_id] = m[li.po_id] || []).push(li); });
    return m;
  }, [projectLineItems]);

  const commitments = useMemo(() => pos.filter(po => po.status !== 'inactive' && (po.approved || po.sent)).map(po => ({
    date: (po.approval_date || po.sent_date || po.created_date || '').slice(0, 10),
    amount: po.total_net_value != null ? Number(po.total_net_value) : (lineItemsByPo[po.dataverse_id] || []).reduce((sum, li) => sum + (Number(li.net_value) || 0), 0),
  })).filter(po => po.date && po.amount > 0), [pos, lineItemsByPo]);

  const delivery = fin.deliveries?.[0];
  const summary = useMemo(() => commercialSummary(delivery, fin.decisions || [], fin.valuations || []), [delivery, fin.decisions, fin.valuations]);
  const health = useMemo(() => commercialHealth(summary, fin.valuations || []), [summary, fin.valuations]);
  const consultants = useMemo(() => consultantFees(delivery), [delivery]);
  const alerts = useMemo(() => commercialAlerts(summary, fin.valuations || [], pos, project, consultants), [summary, fin.valuations, pos, project, consultants]);
  const milestones = useMemo(() => commercialMilestones(project, fin.feeProposals || [], pos, fin.jcts || [], fin.valuations || [], delivery), [project, fin.feeProposals, pos, fin.jcts, fin.valuations, delivery]);
  const retention = useMemo(() => retentionInfo(fin.valuations || [], project), [fin.valuations, project]);

  if (loading || fin.loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <CommercialSummary summary={summary} health={health} />

      {/* Money In & Out chart — preserved exactly as-is */}
      <ProjectCashFlow {...cashFlow} commitments={commitments} />

      <ValuationPosition project={project} valuations={fin.valuations || []} />

      {pos.length > 0 ? (
        <FinancePurchaseOrders pos={pos} lineItemsByPo={lineItemsByPo} supplierMap={supplierMap} project={project} isLegacy={isLegacyProject(project)} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">No purchase orders linked to {project.name}{project.project_number ? ` (${project.project_number})` : ''}.</p>
        </div>
      )}

      <VariationsSummary project={project} decisions={fin.decisions || []} />

      <ProfessionalFees project={project} consultants={consultants} currentContractValue={summary.currentContractValue} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RetentionSummary project={project} retention={retention} />
        <CommercialMilestones milestones={milestones} />
      </div>

      <CommercialAlerts alerts={alerts} />

      <InvoiceReceipts invoices={cashFlow.invoices} loading={cashFlow.loading} error={cashFlow.error} />
    </div>
  );
}

export default ProjectFinanceTab;