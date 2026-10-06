import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll, filterAll } from "@/components/data/loadAll";
import listVisiblePortalUsers from '@/components/data/portalUserDirectory';
import { formatCurrency, formatDate, regionName } from "@/lib/portal";
import { RequestDialog } from "@/components/projects/RequestDialog";
import useProjectPage from '@/components/projects/useProjectPage';
import FrameworkVersionBadge from '@/components/projects/FrameworkVersionBadge';
import ProjectViewControls from '@/components/projects/ProjectViewControls';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import ProjectListView from '@/components/projects/ProjectListView';
import useProjectView from '@/components/projects/useProjectView';
import { projectStaffName } from "@/components/projects/projectStaffName";
import ProjectsOperationalWorkspace from '@/components/projects/workspace/ProjectsOperationalWorkspace';
import ProjectWorkspaceFilters from '@/components/projects/workspace/ProjectWorkspaceFilters';
import ASERatingFilter from '@/components/intelligence/ASERatingFilter';
import { aseRoles } from '@/components/ase/aseClient';
import { FilterSelect } from "@/components/FilterSelect";
import { Button } from "@/components/ui/button";
import { Plus, Building2, PoundSterling, Calendar, Users, ArrowRight, FolderKanban, Search, X } from "lucide-react";

const ProjectMapView = React.lazy(() => import('@/components/projects/ProjectMapView'));

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

  const [externalProjects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [metadataLoading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const { view, setView, density, setDensity } = useProjectView();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [bdmFilter, setBdmFilter] = useState("");
  const [bsmFilter, setBsmFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [meeting,setMeeting]=useState(false);
  const [extraFilters,setExtraFilters]=useState({scope:'',pm:'',client:'',ase:''});
  const serverPaging = !['supplier', 'project_manager'].includes(role);
  const [cursor, setCursor] = useState(null);
  const [previousCursors, setPreviousCursors] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => { const timer = setTimeout(() => setSearchTerm(search), 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { setCursor(null); setPreviousCursors([]); }, [searchTerm, sortBy, bdmFilter, bsmFilter, regionFilter, statusFilter,extraFilters]);
  const projectPage = useProjectPage(user, { search: searchTerm, sort: sortBy, bdm: bdmFilter, bsm: bsmFilter, region: regionFilter, status: statusFilter,...extraFilters }, cursor, serverPaging, refreshKey);
  const projects = serverPaging ? projectPage.items : externalProjects;
  const loading = metadataLoading || projectPage.loading;

  const load = async () => {
    setLoading(true);
    try {
      if (role === 'project_manager') {
        const response = await base44.functions.invoke('manageValuation', { action: 'projects' });
        setProjects((response.data.projects || []).filter((p) => p.status !== 'inactive'));
        return;
      }
      const [p, a, u, staffContacts] = await Promise.all([
        role === 'supplier' ? base44.functions.invoke('supplierProjectAccess', { action: 'projects' }).then(res => res.data.projects || []) : [],
        listAll(base44.entities.Account, "-name").catch(() => []),
        listVisiblePortalUsers().catch(() => []),
        (async () => {
          const [bdmC, bsmC, pmC] = await Promise.all([
            filterAll(base44.entities.Contact, { portal_role: "bdm" }, "-full_name").catch(() => []),
            filterAll(base44.entities.Contact, { portal_role: "bsm" }, "-full_name").catch(() => []),
            filterAll(base44.entities.Contact, { portal_role: "project_manager" }, "-full_name").catch(() => []),
          ]);
          return [...bdmC, ...bsmC, ...pmC];
        })(),
      ]);
      setProjects(p);
      setAccounts(a);
      setUsers(u);
      setContacts(staffContacts);
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
    contacts.forEach((c) => { map[c.id]=c.full_name; if (c.aad_id) map[c.aad_id] = c.full_name; });
    users.forEach((u) => { if (!map[u.id]) map[u.id] = u.full_name || u.email; });
    return map;
  }, [contacts, users]);

  const bdmOptions = useMemo(() => {
    const ids = serverPaging ? projectPage.options?.bdm || [] : [...new Set(projects.map((p) => p.bdm_aad_id).filter(Boolean))];
    return ids.map((id) => ({ value: id, label: projectStaffName(id, staffMap) || "Unknown" }));
  }, [projects, staffMap, serverPaging, projectPage.options]);

  const bsmOptions = useMemo(() => {
    const ids = serverPaging ? projectPage.options?.bsm || [] : [...new Set(projects.map((p) => p.bsm_aad_id).filter(Boolean))];
    return ids.map((id) => ({ value: id, label: projectStaffName(id, staffMap) || "Unknown" }));
  }, [projects, staffMap, serverPaging, projectPage.options]);

  const regionOptions = useMemo(() => {
    if (serverPaging) return (projectPage.options?.region || []).map(r => ({ value: r, label: regionName(r) })).sort((a, b) => a.label.localeCompare(b.label));
    const regions = [...new Set(
      projects.map((p) => regionName(p.department_id)).filter(Boolean)
    )].sort();
    return regions.map((r) => ({ value: r, label: r }));
  }, [projects, accountMap, serverPaging, projectPage.options]);

  const filtered = useMemo(() => {
    if (serverPaging) return projects;
    let result = projects;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) =>
        (p.name || "").toLowerCase().includes(s) ||
        (p.project_number || "").toLowerCase().includes(s) ||
        (accountMap[p.client_account_id]?.name || "").toLowerCase().includes(s)
      );
    }
    if(extraFilters.pm) result=result.filter(p=>p.project_manager_id===extraFilters.pm);
    if(extraFilters.client) result=result.filter(p=>p.client_account_id===extraFilters.client);
    if(extraFilters.scope==='mine') {const ids=[user.id,user.staff_aad_id,user.delegate_of].filter(Boolean);result=result.filter(p=>[p.bdm_aad_id,p.bsm_aad_id,p.project_manager_id].some(id=>ids.includes(id)));}
    if (bdmFilter) result = result.filter((p) => p.bdm_aad_id === bdmFilter);
    if (bsmFilter) result = result.filter((p) => p.bsm_aad_id === bsmFilter);
    if (regionFilter) result = result.filter((p) => regionName(p.department_id) === regionFilter);
    if (statusFilter === "live") result = result.filter((p) => p.live_project === true);
    else if (statusFilter === "on_hold") result = result.filter((p) => p.live_project === false);

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
  }, [projects, search, bdmFilter, bsmFilter, regionFilter, statusFilter, sortBy, accountMap, serverPaging,extraFilters,user]);

  const hasFilters = search || bdmFilter || bsmFilter || regionFilter || statusFilter || Object.values(extraFilters).some(Boolean);
  const clearFilters = () => {
    setSearch(""); setBdmFilter(""); setBsmFilter(""); setRegionFilter(""); setStatusFilter("");setExtraFilters({scope:'',pm:'',client:'',ase:''});
  };

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Projects" eyebrow="Delivery 360" description={canRequest ? "All projects across the UK Leisure Framework." : "Projects you're involved in."} image="https://media.base44.com/images/public/6ab62433a194f918c54c8249/88d79d6ac_generated_ad55df43.png" imageAlt="Floodlit outdoor sports pitch and running track at dusk" actions={<><Button variant={meeting ? 'default' : 'outline'} aria-pressed={meeting} onClick={()=>{setMeeting(v=>!v);setView('workspace');}}>{meeting ? 'Exit Meeting Mode' : 'Meeting Mode'}</Button>{canRequest && <Button onClick={() => setRequestOpen(true)} className="bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Request Project</Button>}</>} />

      {(serverPaging || (!loading && projects.length > 0)) && (
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
            <FilterSelect label="Sort" value={sortBy} onChange={setSortBy} options={role === 'supplier' ? SORT_OPTIONS.filter(o => !o.value.startsWith('value_')) : SORT_OPTIONS} allLabel="Sort" />
            <FilterSelect label="BDMs" value={bdmFilter} onChange={setBdmFilter} options={bdmOptions} />
            <FilterSelect label="BSMs" value={bsmFilter} onChange={setBsmFilter} options={bsmOptions} />
            <FilterSelect label="Regions" value={regionFilter} onChange={setRegionFilter} options={regionOptions} />
            <FilterSelect label="Live / On Hold" value={statusFilter} onChange={setStatusFilter} options={[
              { value: "live", label: "Live" },
              { value: "on_hold", label: "On Hold" },
            ]} />
            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            <ProjectWorkspaceFilters value={extraFilters} onChange={setExtraFilters} options={projectPage.options} projects={projects} serverPaging={serverPaging} staffMap={staffMap} accountMap={accountMap}/>
            {aseRoles.includes(role) && <ASERatingFilter kind="project" value={extraFilters.ase} onChange={ase=>setExtraFilters(old=>({...old,ase}))}/>}
            {!meeting && <ProjectViewControls view={view} onViewChange={setView} density={density} onDensityChange={setDensity} />}
          </div>
          <p className="text-xs text-muted-foreground">{serverPaging ? projectPage.counts ? `${projectPage.counts.matching} matching of ${projectPage.counts.total} projects` : 'Loading project totals…' : `${filtered.length} of ${projects.length} projects`}</p>
        </div>
      )}

      {!serverPaging && (loading || projects.length === 0) && <div className="flex justify-end"><ProjectViewControls view={view} onViewChange={setView} density={density} onDensityChange={setDensity} /></div>}
      {view !== 'map' && projectPage.error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">Unable to load projects. <button type="button" className="underline" onClick={() => setRefreshKey(k => k + 1)}>Try again</button></p>}
      {view === 'workspace' ? <ProjectsOperationalWorkspace user={user} projects={filtered} accountMap={accountMap} staffMap={staffMap} loading={loading} meeting={meeting} total={serverPaging ? projectPage.counts?.matching : filtered.length} filterKey={JSON.stringify([searchTerm,sortBy,bdmFilter,bsmFilter,regionFilter,statusFilter,extraFilters])} mapProps={{user,query:projectPage.mapQuery,sort:projectPage.mapSort,ready:projectPage.mapReady,scopeError:projectPage.scopeError,retryScope:projectPage.retryScope,serverPaging,refreshKey,portfolio:filtered,externalLoading:metadataLoading}} paging={serverPaging && (previousCursors.length || projectPage.next) ? {previousDisabled:!previousCursors.length || loading,nextDisabled:!projectPage.next || loading,previous:()=>{setCursor(previousCursors.at(-1));setPreviousCursors(v=>v.slice(0,-1));},next:()=>{setPreviousCursors(v=>[...v,cursor]);setCursor(projectPage.next);}} : null}/> : view === 'map' ? (
        <React.Suspense fallback={<div role="status" className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
          <ProjectMapView user={user} query={projectPage.mapQuery} sort={projectPage.mapSort} ready={projectPage.mapReady} scopeError={projectPage.scopeError} retryScope={projectPage.retryScope} serverPaging={serverPaging} refreshKey={refreshKey} portfolio={filtered} externalLoading={metadataLoading} />
        </React.Suspense>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{hasFilters ? "No projects match your filters." : "No projects to show yet."}</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">Clear filters</button>
          )}
        </div>
      ) : view === 'list' ? (
        <ProjectListView projects={filtered} accountMap={accountMap} staffMap={staffMap} role={role} density={density} sortBy={sortBy} onSort={setSortBy} />
      ) : (
        <div className="portal-card-grid">
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
                      <FrameworkVersionBadge projectNumber={p.project_number} />
                      <span className={p.live_project ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700" : "rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700"}>
                                               {p.live_project ? "Live" : "On Hold"}
                                             </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{p.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-primary" />
                </div>
                <dl className="mt-3 flex-1 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {client?.name || p.client_name || "—"}</div>
                  {role !== 'supplier' && <div className="flex items-center gap-1.5"><PoundSterling className="h-3.5 w-3.5" /> {formatCurrency(p.estimated_value)}</div>}
                  <div className="flex items-start gap-1.5"><Users className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>BDM: {projectStaffName(p.bdm_aad_id, staffMap) || '—'}<br />BSM: {projectStaffName(p.bsm_aad_id, staffMap) || '—'}</span></div>
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.practical_completion_date)}</div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}

      {view !== 'map' && view !== 'workspace' && serverPaging && (previousCursors.length > 0 || projectPage.next) && <div className="flex justify-between gap-3"><Button variant="outline" disabled={!previousCursors.length || loading} onClick={() => { setCursor(previousCursors[previousCursors.length - 1]); setPreviousCursors(values => values.slice(0, -1)); }}>Previous page</Button><Button variant="outline" disabled={!projectPage.next || loading} onClick={() => { setPreviousCursors(values => [...values, cursor]); setCursor(projectPage.next); }}>Next page</Button></div>}
      <RequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        accounts={accounts}
        users={users}
        user={user}
        onCreated={() => { load(); setCursor(null); setPreviousCursors([]); setRefreshKey(k => k + 1); }}
      />
    </div>
  );
}