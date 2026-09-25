import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { formatDate, regionName } from "@/lib/portal";
import { FilterSelect } from "@/components/FilterSelect";
import { Building2, ExternalLink, CheckCircle2, MapPin, Search, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "company_number", label: "Company Number" },
];

export default function Accounts() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await listAll(base44.entities.Account, "-name"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const regionOptions = useMemo(() => {
    const regions = [...new Set(accounts.map((a) => regionName(a.region)).filter(Boolean))].sort();
    return regions.map((r) => ({ value: r, label: r }));
  }, [accounts]);

  const filtered = useMemo(() => {
    let result = accounts;

    if (typeFilter !== "all") result = result.filter((a) => a.account_type === typeFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((a) =>
        (a.name || "").toLowerCase().includes(s) ||
        (a.company_number || "").toLowerCase().includes(s) ||
        (a.address_city || "").toLowerCase().includes(s)
      );
    }
    if (regionFilter) result = result.filter((a) => regionName(a.region) === regionFilter);
    if (statusFilter === "active") result = result.filter((a) => a.status !== "inactive");
    else if (statusFilter === "inactive") result = result.filter((a) => a.status === "inactive");

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return (a.name || "").localeCompare(b.name || "");
        case "name_desc": return (b.name || "").localeCompare(a.name || "");
        case "company_number": return (a.company_number || "").localeCompare(b.company_number || "");
        default: return 0;
      }
    });
  }, [accounts, typeFilter, search, regionFilter, statusFilter, sortBy]);

  const hasFilters = search || typeFilter !== "all" || regionFilter || statusFilter;
  const clearFilters = () => {
    setSearch(""); setTypeFilter("all"); setRegionFilter(""); setStatusFilter("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">All supplier and client accounts with Companies House data.</p>
      </div>

      {!loading && accounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company number, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <FilterSelect label="Sort" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} allLabel="Sort" />
            <FilterSelect label="Regions" value={regionFilter} onChange={setRegionFilter} options={regionOptions} />
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]} />
            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "client", "supplier"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                  typeFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}>{t === "all" ? "All Types" : t}</button>
            ))}
          </div>
          <p className="text-xs text-slate-400">{filtered.length} of {accounts.length} accounts</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{accounts.length === 0 ? "No accounts yet." : "No accounts match your filters."}</p>
          {accounts.length > 0 && hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Link key={a.id} to={`/accounts/${a.id}`} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                    {a.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.name}</p>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{a.account_type}</span>
                  </div>
                </div>
                {a.uklf_approved && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <dl className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                {a.company_number && <div className="flex justify-between"><dt>Company No.</dt><dd className="text-slate-700">{a.company_number}</dd></div>}
                {a.company_status && <div className="flex justify-between"><dt>Status</dt><dd className="text-slate-700">{a.company_status}</dd></div>}
                {a.date_of_incorporation && <div className="flex justify-between"><dt>Incorporated</dt><dd className="text-slate-700">{formatDate(a.date_of_incorporation)}</dd></div>}
                {a.address_postcode && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.address_city}, {a.address_postcode}</div>}
                {a.email && <div className="flex justify-between"><dt>Email</dt><dd className="truncate text-slate-700">{a.email}</dd></div>}
              </dl>
              <div className="mt-3 flex items-center gap-2">
                {a.ch_links_self && (
                  <a href={a.ch_links_self} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Companies House
                  </a>
                )}
                {a.sharepoint_folder && (
                  <a href={a.sharepoint_folder} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> SharePoint
                  </a>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}