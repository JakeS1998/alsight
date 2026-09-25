import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ProjectHub } from "@/components/projects/ProjectHub";
import { RequestDialog } from "@/components/projects/RequestDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Projects() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const canRequest = ["development_manager", "company_director", "admin"].includes(role);
  const canEditStatus = ["admin", "company_director"].includes(role);

  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, a] = await Promise.all([
        base44.entities.Project.list("-created_date", 200),
        base44.entities.Contract.list("-created_date", 500).catch(() => []),
        canRequest ? base44.entities.Account.list("-name", 200).catch(() => []) : Promise.resolve([]),
      ]);
      setProjects(p);
      setContracts(c);
      setAccounts(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canRequest
              ? "Each project links its questionnaire, agreements and contracts beneath it."
              : "Projects you're involved in, with their linked documents."}
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
          <p className="text-sm text-slate-500">No projects to show yet.</p>
          {canRequest && (
            <Button onClick={() => setRequestOpen(true)} className="mt-4 bg-primary hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" /> Request your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <ProjectHub
              key={p.id}
              project={p}
              contracts={contracts}
              canEditStatus={canEditStatus}
              onUpdated={load}
            />
          ))}
        </div>
      )}

      <RequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        accounts={accounts}
        user={user}
        submitting={submitting}
        setSubmitting={setSubmitting}
        onCreated={load}
      />
    </div>
  );
}