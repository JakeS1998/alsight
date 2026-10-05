import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { INTERNAL_ROLES } from '@/lib/portal';
import ProjectValuationsTab from "@/components/valuations/ProjectValuationsTab";
import UKLFProjectTab from '@/components/framework/UKLFProjectTab';

import { listAll, filterAll } from "@/components/data/loadAll";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";

import ProjectWorkspaceHeader from '@/components/projects/ProjectWorkspaceHeader';
import ProjectWorkspaceNav from '@/components/projects/ProjectWorkspaceNav';
import '@/components/projects/project-workspace.css';

import SupplierProjectDocuments from '@/components/projects/SupplierProjectDocuments';
import SupplierPurchaseOrders from '@/components/projects/SupplierPurchaseOrders';
import ProjectManagerOverview from '@/components/projects/ProjectManagerOverview';
import { ProjectDraftingTab } from "@/components/projects/ProjectDraftingTab";
import frameworkAgreementRoute from '@/components/delivery/frameworkAgreementRoute';
import { ProjectWarrantiesTab } from "@/components/projects/ProjectWarrantiesTab";
import { ProjectFinanceTab } from "@/components/projects/ProjectFinanceTab";
import { ProjectTimelineTab } from "@/components/projects/ProjectTimelineTab";
import { ProjectDeliveryTab } from "@/components/delivery/ProjectDeliveryTab";
import ProjectPathwayAbout from '@/components/delivery/ProjectPathwayAbout';
import PMProjectPathway from '@/components/delivery/PMProjectPathway';
import ProjectChanges from '@/components/alice/ProjectChanges';
import DocumentInsight from '@/components/alice/DocumentInsight';


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
  useEffect(() => {
    if (project?.procurement_route === false && activeTab === 'uklf') setActiveTab('general');
  }, [project?.procurement_route, activeTab]);
  useEffect(() => { const tab = new URLSearchParams(location.search).get('tab'); setActiveTab(isExternalPM ? (['valuations','timeline','drafting','warranties','delivery'].includes(tab) ? tab : 'general') : isSupplier ? (['general','timeline','drafting','warranties','purchase-orders'].includes(tab) ? tab : tab === 'valuations' && canSeeValuations ? 'valuations' : 'general') : (tab === 'valuations' && !canSeeValuations) ? 'general' : ['general','timeline','drafting','warranties','finance','delivery','valuations','uklf'].includes(tab) ? tab : 'general'); }, [location.search, isExternalPM, isSupplier, canSeeValuations]);
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
          !isSupplier || supplierAccountId ? filterAll(base44.entities.LegalDocument, { project_id: { $in: [proj.id, dvId].filter(Boolean) }, ...(isSupplier ? { account_id: supplierAccountId } : {}) }).catch(() => []) : [],
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
    <Tabs className="project-workspace" orientation="vertical" value={activeTab} onValueChange={tab => { setActiveTab(tab); setEditUKLFKpis(false); }}>
      <ProjectWorkspaceNav user={user} project={project} isSupplier={isSupplier} isExternalPM={isExternalPM} canSeeValuations={canSeeValuations} />
      <main className="ws-main">
        <ProjectWorkspaceHeader project={project} user={user} isSupplier={isSupplier} />
        <TabsContent value="general" className="ws-content space-y-6">
          <ProjectGeneralTab project={project} singleTask={frameworkAgreementRoute(legalDocs, dmas, project.project_number).route === 'single_task'} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} />
          {INTERNAL_ROLES.includes(user?.role) && <ProjectChanges key={project.id} project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} />}
        </TabsContent>
        <TabsContent value="timeline" className="ws-content mt-6 space-y-6">
          {INTERNAL_ROLES.includes(user?.role) && <ProjectChanges key={project.id} project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} />}
          <ProjectTimelineTab project={project} legalDocs={isSupplier ? legalDocs.filter(d => supplierAccountId && d.account_id === supplierAccountId) : legalDocs} dmas={isSupplier ? [] : dmas} jcts={isSupplier ? jcts.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.contractor_id === supplierAccountId)) : jcts} warranties={isSupplier ? warranties.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.supplier_id === supplierAccountId)) : warranties} accountMap={accountMap} supplierOnly={isSupplier} supplierOrders={supplierOrders} supplierCompanyNumber={supplierAccountId ? accountMap[supplierAccountId]?.company_number : null} />
          {canSeeProjectOverview && <ProjectManagerOverview projectId={project.id} mode="timeline" supplier={isSupplier} />}
        </TabsContent>
        <TabsContent value="drafting" className="ws-content mt-6 space-y-6">
          {INTERNAL_ROLES.includes(user?.role) && <DocumentInsight project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} />}
          {isSupplier ? <SupplierProjectDocuments project={project} legalDocs={legalDocs} jcts={jcts} accountMap={accountMap} /> : isExternalPM ? <ProjectDraftingTab project={project} legalDocs={legalDocs.filter(d => ['access_agreement','pcsa'].includes(d.document_type))} dmas={dmas} jcts={jcts} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} pmView /> : <ProjectDraftingTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} />}
        </TabsContent>
        <TabsContent value="warranties" className="ws-content mt-6 space-y-6">
          {INTERNAL_ROLES.includes(user?.role) && <DocumentInsight project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} />}
          <ProjectWarrantiesTab project={project} warranties={warranties} accountMap={accountMap} hideCommentsAndLinks={isSupplier} />
          {canSeeProjectOverview && <ProjectManagerOverview projectId={project.id} mode="warranties" supplier={isSupplier} />}
        </TabsContent>
        {isSupplier && <TabsContent value="purchase-orders" className="ws-content mt-6"><SupplierPurchaseOrders project={project} orders={supplierOrders} /></TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="finance" className="ws-content mt-6">
          <ProjectFinanceTab project={project} />
        </TabsContent>}
        {!isSupplier && <TabsContent value="delivery" className="ws-content mt-6">
          {isExternalPM ? <PMProjectPathway project={project} /> : <ProjectDeliveryTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} accountMap={accountMap} />}
          <ProjectPathwayAbout />
        </TabsContent>}
        {canSeeValuations && <TabsContent value="valuations" className="ws-content mt-6"><ProjectValuationsTab project={project} /></TabsContent>}
        {INTERNAL_ROLES.includes(user?.role) && project.procurement_route !== false && <TabsContent value="uklf" className="ws-content mt-6"><UKLFProjectTab projectId={project.id} startEditing={editUKLFKpis} onEditDone={() => setEditUKLFKpis(false)} /></TabsContent>}
      </main>
    </Tabs>
  );
}