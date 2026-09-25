import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DOCUMENT_TYPE } from "@/lib/portal";
import { LegalDocumentCard } from "@/components/documents/LegalDocumentCard";
import { DMACard } from "@/components/documents/DMACard";
import { JCTCard } from "@/components/documents/JCTCard";
import {
  FileSearch, FileCheck, UserCheck, Gavel, FilePlus,
  Check, Clock, ExternalLink, AlertCircle,
} from "lucide-react";

// Lifecycle stages in the requested project order:
// PQ → AA → Pre-Construction appointments → DMA → JCT (+ catch-all at end)
const STAGES = [
  { key: "pq", label: "Project Questionnaire", icon: FileSearch, kind: "pq" },
  { key: "aa", label: "Access Agreement", icon: FileCheck, kind: "legal", docTypes: ["access_agreement"] },
  { key: "precon", label: "Pre-Construction", icon: UserCheck, kind: "legal", docTypes: ["appointment_pm", "appointment_pd_cdm", "appointment_architect", "appointment_pd_br", "pcsa", "loi"] },
  { key: "dma", label: "Development Management Agreement", icon: FileCheck, kind: "dma" },
  { key: "jct", label: "Construction Contract (JCT)", icon: Gavel, kind: "jct" },
  { key: "additional", label: "Additional Works & Other", icon: FilePlus, kind: "legal", docTypes: ["additional_works", "other"] },
];

const STATUS_CFG = {
  complete: { label: "Complete", marker: "border-emerald-500 bg-emerald-500 text-white", line: "bg-emerald-300", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", marker: "border-amber-500 bg-amber-500 text-white", line: "bg-amber-300", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  pending: { label: "Drafting", marker: "border-slate-300 bg-white text-slate-300", line: "bg-slate-200", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  empty: { label: "No documents", marker: "border-slate-200 bg-white text-slate-200", line: "bg-slate-100", badge: "bg-slate-50 text-slate-400 border-slate-200" },
};

function pqStatus(project) {
  if (project.pq_approval_date) return "complete";
  if (project.link_to_project_questionnaire) return "in_progress";
  return "empty";
}

function docStatus(docs) {
  if (!docs.length) return "empty";
  const done = docs.filter((d) => d.executed === "yes").length;
  if (done === docs.length) return "complete";
  if (done > 0) return "in_progress";
  return "pending";
}

function PqCard({ project, psoOutstanding }) {
  if (!project.link_to_project_questionnaire) return null;
  return (
    <a
      href={project.link_to_project_questionnaire}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileSearch className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">Project Questionnaire</p>
            {psoOutstanding && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <AlertCircle className="h-3 w-3" /> PSO outstanding
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Open document in SharePoint</p>
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
    </a>
  );
}

export function ProjectDraftingTab({ project, legalDocs, dmas, jcts, accountMap }) {
  const [psoStatus, setPsoStatus] = useState({ pq: false, aa: false, aa_variations: false, dma: false });

  useEffect(() => {
    (async () => {
      const recs = await base44.entities.ProjectDelivery.filter({ project_id: project.id }, "-created_date", 5).catch(() => []);
      const d = recs[0];
      if (d) {
        setPsoStatus({
          pq: !!d.pso_pq_date,
          aa: !!d.pso_aa_date,
          aa_variations: !!d.pso_aa_variations_date,
          dma: !!d.pso_dma_date,
        });
      }
    })();
  }, [project.id]);

  const docByType = {};
  legalDocs.forEach((d) => {
    if (!docByType[d.document_type]) docByType[d.document_type] = [];
    docByType[d.document_type].push(d);
  });

  const totalDocs = legalDocs.length + dmas.length + jcts.length + (project.link_to_project_questionnaire ? 1 : 0);

  if (totalDocs === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <FileSearch className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">No documents for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {STAGES.map((stage, i) => {
        let docs = [];
        if (stage.kind === "legal") {
          (stage.docTypes || []).forEach((t) => {
            if (docByType[t]) docs = docs.concat(docByType[t]);
          });
        } else if (stage.kind === "dma") {
          docs = dmas;
        } else if (stage.kind === "jct") {
          docs = jcts;
        }

        const status = stage.kind === "pq" ? pqStatus(project) : docStatus(docs);
        const cfg = STATUS_CFG[status];
        const isLast = i === STAGES.length - 1;
        const Icon = stage.icon;

        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${cfg.marker}`}>
                {status === "complete" ? <Check className="h-5 w-5" /> : status === "in_progress" ? <Clock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 my-1 rounded-full ${cfg.line}`} style={{ minHeight: 24 }} />}
            </div>

            <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900">{stage.label}</h3>
                {stage.kind !== "pq" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{docs.length}</span>
                )}
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {stage.kind === "pq" ? (
                project.link_to_project_questionnaire ? (
                  <PqCard project={project} psoOutstanding={!psoStatus.pq} />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3">
                    <p className="text-xs text-slate-400">No project questionnaire linked yet.</p>
                  </div>
                )
              ) : docs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3">
                  <p className="text-xs text-slate-400">No documents at this stage.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stage.kind === "legal" &&
                    docs.map((doc) => {
                      const psoOutstanding = !!doc.drafted_date && (
                        (doc.document_type === "access_agreement" && !psoStatus.aa) ||
                        (doc.document_type === "additional_works" && !psoStatus.aa_variations)
                      );
                      return <LegalDocumentCard key={doc.id} doc={doc} accountName={accountMap[doc.account_id]?.name} psoOutstanding={psoOutstanding} />;
                    })}
                  {stage.kind === "dma" && docs.map((doc) => <DMACard key={doc.id} doc={doc} psoOutstanding={!!doc.drafted_date && !psoStatus.dma} />)}
                  {stage.kind === "jct" &&
                    docs.map((doc) => (
                      <JCTCard
                        key={doc.id}
                        doc={doc}
                        accountName={accountMap[doc.account_id]?.name}
                        contractorName={accountMap[doc.contractor_id]?.name}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProjectDraftingTab;