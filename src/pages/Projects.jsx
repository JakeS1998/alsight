import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/portal";
import { RequestDialog } from "@/components/projects/RequestDialog";
import { Button } from "@/components/ui/button";
import { Plus, Building2, PoundSterling, Calendar, MapPin, ArrowRight, FolderKanban } from "lucide-react";

export default function Projects() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const canRequest = ["development_manager", "company_director", "admin"].includes(role);

  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        base44.entities.Project.list("-created_date", 500),
        base44.entities.Account.list("-name", 500).catch(() => []),
      ]);
      setProjects(p);
      setAccounts(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accountMap = {};
  accounts.forEach((a) => { if (a.dataverse_id) accountMap[a.dataverse_id] = a; });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canRequest ? "All projects across the UK Leisure Framework." : "Projects you're involved in."}
          </p>
        </div>
        {canRequest && (
          <Button onClick={() => setRequestOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Request Project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No projects to show yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const client = accountMap[p.client_account_id];
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {p.project_number && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{p.project_number}</span>
                      )}
                      {p.live_project && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Live</span>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{p.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-primary" />
                </div>
                <dl className="mt-3 flex-1 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {client?.name || "—"}</div>
                  <div className="flex items-center gap-1.5"><PoundSterling className="h-3.5 w-3.5" /> {formatCurrency(p.estimated_value)}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {p.site_postcode || "—"}</div>
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.practical_completion_date)}</div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}

      <RequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        accounts={accounts}
        user={user}
        onCreated={load}
      />
    </div>
  );
}