import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import useProjectCommandData from '@/components/projects/command/useProjectCommandData';
import ProjectCommandCentre from '@/components/projects/command/ProjectCommandCentre';
import ProjectConnectedTabs from '@/components/projects/command/ProjectConnectedTabs';
import ProjectRecordDetails from '@/components/projects/command/ProjectRecordDetails';
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { INTERNAL_ROLES } from '@/lib/portal';
import ProjectValuationsTab from "@/components/valuations/ProjectValuationsTab";
import UKLFProjectTab from '@/components/framework/UKLFProjectTab';

import { listAll } from "@/components/data/loadAll";
import useProjectDocuments from '@/components/projects/useProjectDocuments';
import ProjectDocumentLoadState from '@/components/projects/ProjectDocumentLoadState';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";

import ProjectWorkspaceHeader from '@/components/projects/ProjectWorkspaceHeader';
import ProjectStickyHeader from '@/components/projects/ProjectStickyHeader';
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
import ProjectAttention from '@/components/projects/ProjectAttention';
import ProjectPurpose from '@/components/alliance/ProjectPurpose';

import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';
import useProjectReportingRefresh from '@/components/projects/useProjectReportingRefresh';


export default function ProjectDetail({ embedded = false, embeddedProjectId, suppliedAccountMap, extraNavigation, extraContent, actionsContent } = {}) {
  const { projectId: routeProjectId } = useParams();
  const projectId = embedded ? embeddedProjectId : routeProjectId;
  const Header = embedded ? 'div' : ProjectStickyHeader;
  const location = useLocation(), navigate = useNavigate();
  const { user } = useAuth();
  const internal = INTERNAL_ROLES.includes(user?.role), approvalAccess = useApprovalAccess();
  const isExternalPM = user?.role === 'project_manager';
  const isSupplier = user?.role === 'supplier';
  const supplierAccountId = user?.account_id || user?.data?.account_id;
  const [project, setProject] = useState(null);
  const command = useProjectCommandData(project, user, approvalAccess.enabled);
  useProjectReportingRefresh(project?.id,setProject);
  const canSeeValuations = isExternalPM || INTERNAL_ROLES.includes(user?.role) || (isSupplier && !!project?.can_submit_valuation);
  const canSeeProjectOverview = isSupplier && !!project?.can_submit_valuation;
  const [activeTab, setActiveTab] = useState('general');
  const [editUKLFKpis, setEditUKLFKpis] = useState(false);
  const selectTab = tab => {
    setActiveTab(tab); setEditUKLFKpis(false);
    if (!embedded) { const params = new URLSearchParams(location.search); params.set('tab', tab); navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true }); }
  };
  useEffect(() => {
    if (project?.procurement_route === false && activeTab === 'uklf') setActiveTab('general');
  }, [project?.procurement_route, activeTab]);
  useEffect(() => {
    if (embedded) return;
    const requested = new URLSearchParams(location.search).get('tab');
    const tab = ({ overview:'general', programme:'timeline', commercial:'finance', journey:'delivery', documents:'drafting' })[requested] || requested;
    const allowed = isExternalPM ? ['general','valuations','timeline','drafting','warranties','delivery'] : isSupplier ? ['general','timeline','drafting','warranties','purchase-orders',...(canSeeValuations ? ['valuations'] : [])] : ['general','timeline','drafting','warranties','finance','delivery','valuations','uklf',...(internal ? ['activity','risks','actions','decisions','people','handover',...(approvalAccess.enabled ? ['approvals'] : [])] : [])];
    setActiveTab(allowed.includes(tab) ? tab : 'general');
  }, [location.search, embedded, isExternalPM, isSupplier, canSeeValuations, internal, approvalAccess.enabled]);
  const documents = useProjectDocuments(project, user);
  const { legalDocs, dmas, jcts, warranties } = documents;
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [accountMap, setAccountMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const proj = isExternalPM ? (await base44.functions.invoke('manageValuation', { action: 'project', projectId }).catch(() => ({ data: { project: null } }))).data.project : isSupplier ? (await Promise.all([base44.functions.invoke('supplierProjectAccess', { action: 'project', projectId }).then(res => res.data.project).catch(() => null), base44.functions.invoke('manageValuation', { action: 'project', projectId }).then(res => res.data.project).catch(() => null)]).then(([linked, manager]) => (linked || manager) ? { ...(linked || manager), can_submit_valuation: !!manager } : null)) : await base44.entities.Project.get(projectId).catch(() => null);
        if (!proj || proj.status === 'inactive') { setProject(null); return; }
        setProject(proj);
        const [accounts, orders] = await Promise.all([
          suppliedAccountMap ? [] : listAll(base44.entities.Account, "-name").catch(() => []),
          isSupplier ? base44.functions.invoke('supplierProjectAccess', { action: 'orders', projectId }).then(res => res.data.orders || []).catch(() => []) : [],
        ]);
        setSupplierOrders(orders);

        const map = {};
        accounts.forEach((a) => { map[a.dataverse_id || a.id] = a; });
        setAccountMap(suppliedAccountMap || map);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, isExternalPM, isSupplier, supplierAccountId]);

  if (loading || documents.loading) {
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
    <Tabs className={embedded ? 'project-workspace meeting-project-workspace' : 'project-workspace'} orientation="horizontal" value={activeTab} onValueChange={selectTab}>
      <main className="ws-main">
        <Header className="ws-sticky-header">
          {!embedded && <ProjectWorkspaceHeader project={project} user={user} isSupplier={isSupplier} client={accountMap[project.client_account_id]} />}
          <ProjectWorkspaceNav user={user} project={project} isSupplier={isSupplier} isExternalPM={isExternalPM} canSeeValuations={canSeeValuations} onSelectTab={selectTab} activeTab={activeTab} approvalAccess={approvalAccess.enabled}>{extraNavigation}</ProjectWorkspaceNav>
        </Header>
        <TabsContent value="general" className="ws-content space-y-6">
          {internal && <><ProjectCommandCentre project={project} client={accountMap[project.client_account_id]} query={command} onSelect={selectTab} compact={embedded}/><ProjectAttention project={project}/></>}
          {!INTERNAL_ROLES.includes(user?.role) && <ProjectPurpose key={project.id} project={project} onUpdated={updated=>setProject(current=>({...current,...updated}))} />}
          <ProjectRecordDetails internal={internal}><DataverseRecordEdit table="projects" record={project} onUpdated={setProject}><ProjectGeneralTab project={project} singleTask={frameworkAgreementRoute(legalDocs, dmas, project.project_number).route === 'single_task'} accountMap={accountMap} legalDocs={legalDocs} jcts={jcts} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} /></DataverseRecordEdit></ProjectRecordDetails>
        </TabsContent>
        <TabsContent value="timeline" className="ws-content mt-6 space-y-6">
          {INTERNAL_ROLES.includes(user?.role) && <ProjectChanges key={project.id} project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} />}
          <ProjectTimelineTab project={project} legalDocs={isSupplier ? legalDocs.filter(d => supplierAccountId && d.account_id === supplierAccountId) : legalDocs} dmas={isSupplier ? [] : dmas} jcts={isSupplier ? jcts.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.contractor_id === supplierAccountId)) : jcts} warranties={isSupplier ? warranties.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.supplier_id === supplierAccountId)) : warranties} accountMap={accountMap} supplierOnly={isSupplier} supplierOrders={supplierOrders} supplierCompanyNumber={supplierAccountId ? accountMap[supplierAccountId]?.company_number : null} />
          {canSeeProjectOverview && <ProjectManagerOverview projectId={project.id} mode="timeline" supplier={isSupplier} />}
        </TabsContent>
        <TabsContent value="drafting" className="ws-content mt-6 space-y-6">
          {!documents.error && <>
            {INTERNAL_ROLES.includes(user?.role) && <DocumentInsight project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} />}
            {isSupplier ? <SupplierProjectDocuments project={project} legalDocs={legalDocs} jcts={jcts} accountMap={accountMap} /> : isExternalPM ? <ProjectDraftingTab project={project} legalDocs={legalDocs.filter(d => ['access_agreement','pcsa'].includes(d.document_type))} dmas={dmas} jcts={jcts} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} pmView /> : <ProjectDraftingTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} accountMap={accountMap} onProjectUpdated={updated => setProject(current => ({ ...current, ...updated }))} />}
          </>}
          <ProjectDocumentLoadState documents={documents} />
        </TabsContent>
        <TabsContent value="warranties" className="ws-content mt-6 space-y-6">
          {INTERNAL_ROLES.includes(user?.role) && <DocumentInsight project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} />}
          {!documents.error && <ProjectWarrantiesTab project={project} warranties={warranties} accountMap={accountMap} hideCommentsAndLinks={isSupplier} />}
          <ProjectDocumentLoadState documents={documents} />
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
        {internal && <ProjectConnectedTabs project={project} user={user} query={command} accountMap={accountMap} legalDocs={legalDocs} dmas={dmas} jcts={jcts} actionsContent={actionsContent} approvalAccess={approvalAccess.enabled}/>}
        {extraContent}
      </main>
    </Tabs>
  );
}