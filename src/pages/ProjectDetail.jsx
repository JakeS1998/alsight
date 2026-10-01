import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { INTERNAL_ROLES } from '@/lib/portal';
import ProjectValuationsTab from "@/components/valuations/ProjectValuationsTab";
import UKLFProjectTab from '@/components/framework/UKLFProjectTab';
import UKLFIcon from '@/components/framework/UKLFIcon';
import SourceOpportunityLink from '@/components/crm/SourceOpportunityLink';
import { listAll, filterAll } from "@/components/data/loadAll";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";
import ProjectPOReferences from '@/components/projects/ProjectPOReferences';
import ProjectStickyHeader from '@/components/projects/ProjectStickyHeader';
import FrameworkVersionBadge from '@/components/projects/FrameworkVersionBadge';
import SupplierProjectDocuments from '@/components/projects/SupplierProjectDocuments';
import SupplierPurchaseOrders from '@/components/projects/SupplierPurchaseOrders';
import ProjectManagerOverview from '@/components/projects/ProjectManagerOverview';
import { ProjectDraftingTab } from "@/components/projects/ProjectDraftingTab";
import { ProjectWarrantiesTab } from "@/components/projects/ProjectWarrantiesTab";
import { ProjectFinanceTab } from "@/components/projects/ProjectFinanceTab";
import { ProjectTimelineTab } from "@/components/projects/ProjectTimelineTab";
import { ProjectDeliveryTab } from "@/components/delivery/ProjectDeliveryTab";
import { ArrowLeft, FileText, ShieldCheck, LayoutDashboard, Receipt, Calendar, ClipboardList, ListChecks } from "lucide-react";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const isExternalPM = user?.role === 'project_manager';
  const isSupplier = user?.role === 'supplier';
  const supplierAccountId = user?.account_id || user?.data?.account_id;
  const [project, setProject] = useState(null);
  const canSeeValuations = isExternalPM || INTERNAL_ROLES.includes(user?.role) || (isSupplier && !!project?.can_submit_valuation);
  const canSeeProjectOverview = isSupplier && !!project?.can_submit_valuation;
  const [activeTab, setActiveTab] = useState('general');
  const [editUKLFKpis, setEditUKLFKpis] = useState(false);
  useEffect(() => { const tab = new URLSearchParams(location.search).get('tab'); setActiveTab(isExternalPM ? (['valuations','timeline','drafting','warranties'].includes(tab) ? tab : 'general') : isSupplier ? (['general','timeline','drafting','warranties','purchase-orders'].includes(tab) ? tab : tab === 'valuations' && canSeeValuations ? 'valuations' : 'general') : (tab === 'valuations' && !canSeeValuations) ? 'general' : ['general','timeline','drafting','warranties','finance','delivery','valuations','uklf'].includes(tab) ? tab : 'general'); }, [location.search, isExternalPM, isSupplier, canSeeValuations]);
  const [legalDocs, setLegalDocs] = useState([]);
  const [dmas, setDmas] = useState([]);
  const [jcts, setJcts] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [accountMap, setAccountMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const proj = isExternalPM ? (await base44.functions.invoke('manageValuation', { action: 'project', projectId }).catch(() => ({ data: { project: null } }))).data.project : isSupplier ? (await Promise.all([base44.functions.invoke('supplierProjectAccess', { action: 'project', projectId }).then(res => res.data.project).catch(() => null), base44.functions.invoke('manageValuation', { action: 'project', projectId }).then(res => res.data.project).catch(() => null)]).then(([linked, manager]) => (linked || manager) ? { ...(linked || manager), can_submit_valuation: !!manager } : null)) : await base44.entities.Project.get(projectId).catch(() => null);
        if (!proj || proj.status === 'inactive') { setProject(null); return; }
        setProject(proj);
        const dvId = proj.dataverse_id;

        const [docs, dmasData, jctsData, warrs, accounts, orders] = await Promise.all([
          !isSupplier || supplierAccountId ? filterAll(base44.entities.LegalDocument, { project_id: dvId, ...(isSupplier ? { account_id: supplierAccountId } : {}) }).catch(() => []) : [],
          isSupplier ? [] : filterAll(base44.entities.DMA, { project_id: dvId }).catch(() => []),
          !isSupplier || supplierAccountId ? filterAll(base44.entities.JCT, { project_id: dvId, ...(isSupplier ? { $or: [{ account_id: supplierAccountId }, { contractor_id: supplierAccountId }] } : {}) }).catch(() => []) : [],
          !isSupplier || supplierAccountId ? filterAll(base44.entities.Warranty, { project_id: dvId, ...(isSupplier ? { $or: [{ account_id: supplierAccountId }, { supplier_id: supplierAccountId }] } : {}) }).catch(() => []) : [],
          listAll(base44.entities.Account, "-name").catch(() => []),
          isSupplier ? base44.functions.invoke('supplierProjectAccess', { action: 'orders', projectId }).then(res => res.data.orders || []).catch(() => []) : [],
        ]);

        setLegalDocs(docs);
        setDmas(dmasData);
        setJcts(jctsData);
        setWarranties(warrs);
        setSupplierOrders(orders);

        const map = {};
        accounts.forEach((a) => { if (a.dataverse_id) map[a.dataverse_id] = a; });
        setAccountMap(map);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, isExternalPM, isSupplier, supplierAccountId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">Project not found.</p>
        <Link to="/projects" className="mt-3 inline-block text-sm text-primary hover:underline">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <Tabs value={activeTab} onValueChange={tab => { setActiveTab(tab); setEditUKLFKpis(false); }}>
        <ProjectStickyHeader>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
              <ProjectPOReferences project={project} />
              <FrameworkVersionBadge projectNumber={project.project_number} />
              <span className={project.live_project ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700" : "rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700"}>{project.live_project ? "Live" : "On Hold"}</span>
              {typeof project.procurement_route === 'boolean' && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{project.procurement_route ? 'Framework' : 'Direct'}</span>}
            </div>
            {!isSupplier && project.description && <p className="mt-1 text-sm text-slate-500">{project.description}</p>}
            {INTERNAL_ROLES.includes(user?.role) && <SourceOpportunityLink projectId={project.id} />}
          </div>
          <div className="relative"><div className="snap-x snap-proximity overflow-x-auto pb-2 [scrollbar-width:thin]" aria-label="Scroll to see all project tabs"><TabsList className="h-auto w-max min-w-full flex-nowrap justify-start gap-1 [&>button]:shrink-0 [&>button]:snap-start">
            <TabsTrigger value="general"><LayoutDashboard className="mr-1.5 h-4 w-4" /> {isSupplier || isExternalPM ? 'Project details' : 'General'}</TabsTrigger>
            <TabsTrigger value="timeline"><Calendar className="mr-1.5 h-4 w-4" /> Timeline</TabsTrigger>
            <TabsTrigger value="drafting"><FileText className="mr-1.5 h-4 w-4" /> Documents</TabsTrigger>
            <TabsTrigger value="warranties"><ShieldCheck className="mr-1.5 h-4 w-4" /> Warranties</TabsTrigger>
            {isSupplier && <TabsTrigger value="purchase-orders"><Receipt className="mr-1.5 h-4 w-4" /> Purchase orders</TabsTrigger>}
            {!isExternalPM && !isSupplier && <TabsTrigger value="finance"><Receipt className="mr-1.5 h-4 w-4" /> Finance</TabsTrigger>}
            {!isExternalPM && !isSupplier && <TabsTrigger value="delivery"><ClipboardList className="mr-1.5 h-4 w-4" /> Delivery</TabsTrigger>}
            {canSeeValuations && <TabsTrigger value="valuations"><ListChecks className="mr-1.5 h-4 w-4" /> Valuations</TabsTrigger>}
            {INTERNAL_ROLES.includes(user?.role) && <TabsTrigger value="uklf"><UKLFIcon /> UKLF</TabsTrigger>}
          </TabsList></div><div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-secondary to-transparent sm:hidden" /></div>
        </ProjectStickyHeader>
        <TabsContent value="general" className="mt-6">
          <ProjectGeneralTab project={project} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-6 space-y-6">
          <ProjectTimelineTab project={project} legalDocs={isSupplier ? legalDocs.filter(d => supplierAccountId && d.account_id === supplierAccountId) : legalDocs} dmas={isSupplier ? [] : dmas} jcts={isSupplier ? jcts.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.contractor_id === supplierAccountId)) : jcts} warranties={isSupplier ? warranties.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.supplier_id === supplierAccountId)) : warranties} accountMap={accountMap} supplierOnly={isSupplier} supplierOrders={supplierOrders} supplierCompanyNumber={supplierAccountId ? accountMap[supplierAccountId]?.company_number : null} />
          {canSeeProjectOverview && <ProjectManagerOverview projectId={project.id} mode="timeline" supplier={isSupplier} />}
        </TabsContent>
        <TabsContent value="drafting" className="mt-6">
          {isSupplier ? <SupplierProjectDocuments project={project} legalDocs={legalDocs} jcts={jcts} accountMap={accountMap} /> : isExternalPM ? <ProjectDraftingTab project={project} legalDocs={legalDocs.filter(d => ['access_agreement','pcsa'].includes(d.document_type))} dmas={dmas} jcts={jcts} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} pmView /> : <ProjectDraftingTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} />}
        </TabsContent>
        <TabsContent value="warranties" className="mt-6 space-y-6">
          <ProjectWarrantiesTab project={project} warranties={warranties} accountMap={accountMap} hideCommentsAndLinks={isSupplier} />
          {canSeeProjectOverview && <ProjectManagerOverview projectId={project.id} mode="warranties" supplier={isSupplier} />}
        </TabsContent>
        {isSupplier && <TabsContent value="purchase-orders" className="mt-6"><SupplierPurchaseOrders project={project} orders={supplierOrders} /></TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="finance" className="mt-6">
          <ProjectFinanceTab project={project} />
        </TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="delivery" className="mt-6">
          <ProjectDeliveryTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} accountMap={accountMap} />
        </TabsContent>}
        {canSeeValuations && <TabsContent value="valuations" className="mt-6"><ProjectValuationsTab project={project} /></TabsContent>}
        {INTERNAL_ROLES.includes(user?.role) && <TabsContent value="uklf" className="mt-6"><UKLFProjectTab projectId={project.id} startEditing={editUKLFKpis} onEditDone={() => setEditUKLFKpis(false)} /></TabsContent>}
      </Tabs>
    </div>
  );
}