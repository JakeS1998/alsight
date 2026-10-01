import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import { listAll } from "@/components/data/loadAll";
import { DOCUMENT_TYPE, formatDate } from "@/lib/portal";
import { legalDocumentName } from "@/components/documents/documentNames";
import { DocTypeBadge, ExecutedBadge } from "@/components/StatusBadge";
import { FileText, ExternalLink, Filter } from "lucide-react";

export default function LegalDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const [d, p, a] = await Promise.all([
          listAll(base44.entities.LegalDocument),
          listAll(base44.entities.Project).catch(() => []),
          listAll(base44.entities.Account, '-name').catch(() => []),
        ]);
        setDocs(d);
        setProjects(p);
        setAccounts(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const projectMap = {};
  projects.forEach((p) => { projectMap[p.id] = p; if (p.dataverse_id) projectMap[p.dataverse_id] = p; });
  const accountMap = {};
  accounts.forEach((a) => { if (a.dataverse_id) accountMap[a.dataverse_id] = a; });

  const filtered = typeFilter === "all" ? docs : docs.filter((d) => d.document_type === typeFilter);
  const types = Object.keys(DOCUMENT_TYPE).filter((t) => t !== "other" && docs.some((d) => d.document_type === t));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Legal Documents</h1>
        <p className="mt-1 text-sm text-slate-500">All legal documents across your leisure construction projects.</p>
      </div>

      {!loading && docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterPill active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All</FilterPill>
          {types.map((key) => (
            <FilterPill key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)}>
              {DOCUMENT_TYPE[key].label}
            </FilterPill>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No documents match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const project = projectMap[d.project_id];
            return (
              <div key={d.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{legalDocumentName(d, project?.name, accountMap[d.account_id]?.name, project?.project_number)}</p>
                    <div className="mt-1"><DocTypeBadge type={d.document_type} projectNumber={project?.project_number} /></div>
                  </div>
                  <ExecutedBadge status={d.executed} />
                </div>
                <dl className="flex-1 space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between"><dt>Project</dt>
                    <dd className="text-slate-700">
                      {project ? (
                        <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline truncate">{project.name}</Link>
                      ) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between"><dt>Drafted</dt><dd className="text-slate-700">{formatDate(d.drafted_date)}</dd></div>
                  <div className="flex justify-between"><dt>Approval</dt><dd className="text-slate-700">{d.approval_status || "—"}</dd></div>
                  <div className="flex justify-between"><dt>Execution</dt><dd className="text-slate-700">{formatDate(d.date_of_execution)}</dd></div>
                </dl>
                {user?.role !== 'supplier' && d.link_to_file && (
                  <a href={d.link_to_file} target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    <ExternalLink className="h-4 w-4" /> View File
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}>
      {children}
    </button>
  );
}