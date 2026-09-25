import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, regionName } from "@/lib/portal";
import { RequestDialog } from "@/components/projects/RequestDialog";
import { FilterSelect } from "@/components/FilterSelect";
import { Button } from "@/components/ui/button";
import { Plus, Building2, PoundSterling, Calendar, MapPin, ArrowRight, FolderKanban, Search, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "number", label: "Project Number" },
  { value: "value_desc", label: "Value: High to Low" },
  { value: "value_asc", label: "Value: Low to High" },
  { value: "newest", label: "Newest First" },
];

export default function Projects() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const canRequest = ["admin", "director", "bdm"].includes(role);

  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [bdmFilter, setBdmFilter] = useState("");
  const [bsmFilter, setBsmFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [p, a, u, c] = await Promise.all([
        base44.entities.Project.list("-created_date", 500),
        base44.entities.Account.list("-name", 500).catch(() => []),
        base44.entities.User.list("-created_date", 500).catch(() => []),
        base44.entities.Contact.filter({ system_managed: true }, "-full_name", 2000).catch(() => []),
      ]);
      setProjects(p);
      setAccounts(a);
      setUsers(u);
      setContacts(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((a) => { if (a.dataverse_id) map[a.dataverse_id] = a; });
    return map;
  }, [accounts]);

  const staffMap = useMemo(() => {
    const map = {};
    contacts.forEach((c) => { if (c.aad_id) map[c.aad_id] = c.full_name; });
    users.forEach((u) => { if (!map[u.id]) map[u.id] = u.full_name || u.email; });
    return map;
  }, [contacts, users]);

  const bdmOptions = useMemo(() => {
    const ids = [...new Set(projects.map((p) => p.bdm_aad_id).filter(Boolean))];
    return ids.map((id) => ({ value: id, label: staffMap[id] || "Unknown" }));
  }, [projects, staffMap]);

  const bsmOptions = useMemo(() => {
    const ids = [...new Set(projects.map((p) => p.bsm_aad_id).filter(Boolean))];
    return ids.map((id) => ({ value: id, label: staffMap[id] || "Unknown" }));
  }, [projects, staffMap]);

  const regionOptions = useMemo(() => {
    const regions = [...new Set(
      projects.map((p) => regionName(p.department_id)).filter(Boolean)
    )].sort();
    return regions.map((r) => ({ value: r, label: r }));
  }, [projects, accountMap]);

  const filtered = useMemo(() => {
    let result = projects;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) =>
        (p.name || "").toLowerCase().includes(s) ||
        (p.project_number || "").toLowerCase().includes(s) ||
        (accountMap[p.client_account_id]?.name || "").toLowerCase().includes(s)
      );
    }
    if (bdmFilter) result = result.filter((p) => p.bdm_aad_id === bdmFilter);
    if (bsmFilter) result = result.filter((p) => p.bsm_aad_id === bsmFilter);
    if (regionFilter) result = result.filter((p) => regionName(p.department_id) === regionFilter);
    if (statusFilter === "live") result = result.filter((p) => p.live_project);
    else if (statusFilter === "inactive") result = result.filter((p) => !p.live_project);

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return (a.name || "").localeCompare(b.name || "");
        case "name_desc": return (b.name || "").localeCompare(a.name || "");
        case "number": return (a.project_number || "").localeCompare(b.project_number || "");
        case "value_desc": return (b.estimated_value || 0) - (a.estimated_value || 0);
        case "value_asc": return (a.estimated_value || 0) - (b.estimated_value || 0);
        case "newest": return new Date(b.created_date) - new Date(a.created_date);
        default: return 0;
      }
    });
  }, [projects, search, bdmFilter, bsmFilter, regionFilter, statusFilter, sortBy, accountMap]);

  const hasFilters = search || bdmFilter || bsmFilter || regionFilter || statusFilter;
  const clearFilters = () => {
    setSearch(""); setBdmFilter(""); setBsmFilter(""); setRegionFilter(""); setStatusFilter("");
  };

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

      {!loading && projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, number, or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <FilterSelect label="Sort" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} allLabel="Sort" />
            <FilterSelect label="BDMs" value={bdmFilter} onChange={setBdmFilter} options={bdmOptions} />
            <FilterSelect label="BSMs" value={bsmFilter} onChange={setBsmFilter} options={bsmOptions} />
            <FilterSelect label="Regions" value={regionFilter} onChange={setRegionFilter} options={regionOptions} />
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[
              { value: "live", label: "Live" },
              { value: "inactive", label: "Inactive" },
            ]} />
            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">{filtered.length} of {projects.length} projects</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{projects.length === 0 ? "No projects to show yet." : "No projects match your filters."}</p>
          {projects.length > 0 && hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
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