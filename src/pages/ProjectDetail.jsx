import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { INTERNAL_ROLES } from '@/lib/portal';
import ProjectValuationsTab from "@/components/valuations/ProjectValuationsTab";
import SourceOpportunityLink from '@/components/crm/SourceOpportunityLink';
import { listAll, filterAll } from "@/components/data/loadAll";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";
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
  const canSeeValuations = isExternalPM || INTERNAL_ROLES.includes(user?.role);
  const [activeTab, setActiveTab] = useState('general');
  useEffect(() => { const tab = new URLSearchParams(location.search).get('tab'); setActiveTab(isExternalPM ? 'valuations' : isSupplier ? 'timeline' : (tab === 'valuations' && !canSeeValuations) ? 'general' : ['general','timeline','drafting','warranties','finance','delivery','valuations'].includes(tab) ? tab : 'general'); }, [location.search, isExternalPM, isSupplier, canSeeValuations]);
  const [project, setProject] = useState(null);
  const [legalDocs, setLegalDocs] = useState([]);
  const [dmas, setDmas] = useState([]);
  const [jcts, setJcts] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [accountMap, setAccountMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const proj = isExternalPM ? (await base44.functions.invoke('manageValuation', { action: 'project', projectId }).catch(() => ({ data: { project: null } }))).data.project : await base44.entities.Project.get(projectId).catch(() => null);
        if (!proj || proj.status === 'inactive') { setProject(null); return; }
        setProject(proj);
        if (isExternalPM) return;
        const dvId = proj.dataverse_id;

        const [docs, dmasData, jctsData, warrs, accounts] = await Promise.all([
          !isSupplier || supplierAccountId ? filterAll(base44.entities.LegalDocument, { project_id: dvId, ...(isSupplier ? { account_id: supplierAccountId } : {}) }).catch(() => []) : [],
          isSupplier ? [] : filterAll(base44.entities.DMA, { project_id: dvId }).catch(() => []),
          !isSupplier || supplierAccountId ? filterAll(base44.entities.JCT, { project_id: dvId, ...(isSupplier ? { $or: [{ account_id: supplierAccountId }, { contractor_id: supplierAccountId }] } : {}) }).catch(() => []) : [],
          !isSupplier || supplierAccountId ? filterAll(base44.entities.Warranty, { project_id: dvId, ...(isSupplier ? { $or: [{ account_id: supplierAccountId }, { supplier_id: supplierAccountId }] } : {}) }).catch(() => []) : [],
          listAll(base44.entities.Account, "-name").catch(() => []),
        ]);

        setLegalDocs(docs);
        setDmas(dmasData);
        setJcts(jctsData);
        setWarranties(warrs);

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

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
          {project.project_number && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-600">{project.project_number}</span>
          )}
          <span className={project.live_project ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700" : "rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700"}>{project.live_project ? "Live" : "On Hold"}</span>
          {typeof project.procurement_route === 'boolean' && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{project.procurement_route ? 'Framework' : 'Direct'}</span>
          )}
        </div>
        {!isSupplier && project.description && <p className="mt-1 text-sm text-slate-500">{project.description}</p>}
        {INTERNAL_ROLES.includes(user?.role) && <SourceOpportunityLink projectId={project.id} />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="h-auto flex-wrap justify-start">
        {!isExternalPM && !isSupplier && <TabsTrigger value="general"><LayoutDashboard className="mr-1.5 h-4 w-4" /> General</TabsTrigger>}
        {!isExternalPM && <TabsTrigger value="timeline"><Calendar className="mr-1.5 h-4 w-4" /> Timeline</TabsTrigger>}
        {!isExternalPM && !isSupplier && <TabsTrigger value="drafting"><FileText className="mr-1.5 h-4 w-4" /> Documents</TabsTrigger>}
        {!isExternalPM && !isSupplier && <TabsTrigger value="warranties"><ShieldCheck className="mr-1.5 h-4 w-4" /> Warranties</TabsTrigger>}
        {!isExternalPM && !isSupplier && <TabsTrigger value="finance"><Receipt className="mr-1.5 h-4 w-4" /> Finance</TabsTrigger>}
        {!isExternalPM && !isSupplier && <TabsTrigger value="delivery"><ClipboardList className="mr-1.5 h-4 w-4" /> Delivery</TabsTrigger>}
        {canSeeValuations && <TabsTrigger value="valuations"><ListChecks className="mr-1.5 h-4 w-4" /> Valuations</TabsTrigger>}
      </TabsList>
        {!isExternalPM && !isSupplier && <TabsContent value="general" className="mt-6">
          <ProjectGeneralTab project={project} accountMap={accountMap} />
        </TabsContent>}
        {!isExternalPM && <TabsContent value="timeline" className="mt-6">
          <ProjectTimelineTab project={project} legalDocs={isSupplier ? legalDocs.filter(d => supplierAccountId && d.account_id === supplierAccountId) : legalDocs} dmas={isSupplier ? [] : dmas} jcts={isSupplier ? jcts.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.contractor_id === supplierAccountId)) : jcts} warranties={isSupplier ? warranties.filter(d => supplierAccountId && (d.account_id === supplierAccountId || d.supplier_id === supplierAccountId)) : warranties} accountMap={accountMap} supplierOnly={isSupplier} supplierCompanyNumber={supplierAccountId ? accountMap[supplierAccountId]?.company_number : null} />
        </TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="drafting" className="mt-6">
          <ProjectDraftingTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} accountMap={accountMap} />
        </TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="warranties" className="mt-6">
          <ProjectWarrantiesTab project={project} warranties={warranties} accountMap={accountMap} />
        </TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="finance" className="mt-6">
          <ProjectFinanceTab project={project} />
        </TabsContent>}
        {!isExternalPM && !isSupplier && <TabsContent value="delivery" className="mt-6">
          <ProjectDeliveryTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} accountMap={accountMap} />
        </TabsContent>}
        {canSeeValuations && <TabsContent value="valuations" className="mt-6"><ProjectValuationsTab project={project} /></TabsContent>}
      </Tabs>
    </div>
  );
}