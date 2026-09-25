import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";
import { ProjectDraftingTab } from "@/components/projects/ProjectDraftingTab";
import { ProjectWarrantiesTab } from "@/components/projects/ProjectWarrantiesTab";
import { ArrowLeft, FileText, ShieldCheck, LayoutDashboard } from "lucide-react";

export default function ProjectDetail() {
  const { projectId } = useParams();
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
        const proj = await base44.entities.Project.get(projectId);
        setProject(proj);
        const dvId = proj.dataverse_id;

        const [docs, dmasData, jctsData, warrs, accounts] = await Promise.all([
          base44.entities.LegalDocument.filter({ project_id: dvId }, "-created_date", 500).catch(() => []),
          base44.entities.DMA.filter({ project_id: dvId }, "-created_date", 500).catch(() => []),
          base44.entities.JCT.filter({ project_id: dvId }, "-created_date", 500).catch(() => []),
          base44.entities.Warranty.filter({ project_id: dvId }, "-created_date", 500).catch(() => []),
          base44.entities.Account.list("-name", 500).catch(() => []),
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
  }, [projectId]);

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
          {project.live_project && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">Live</span>
          )}
          {project.procurement_route && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">UKLF</span>
          )}
        </div>
        {project.description && <p className="mt-1 text-sm text-slate-500">{project.description}</p>}
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><LayoutDashboard className="mr-1.5 h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="drafting"><FileText className="mr-1.5 h-4 w-4" /> Drafting List</TabsTrigger>
          <TabsTrigger value="warranties"><ShieldCheck className="mr-1.5 h-4 w-4" /> Warranties</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <ProjectGeneralTab project={project} accountMap={accountMap} />
        </TabsContent>
        <TabsContent value="drafting" className="mt-6">
          <ProjectDraftingTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} accountMap={accountMap} />
        </TabsContent>
        <TabsContent value="warranties" className="mt-6">
          <ProjectWarrantiesTab project={project} warranties={warranties} accountMap={accountMap} />
        </TabsContent>
      </Tabs>
    </div>
  );
}