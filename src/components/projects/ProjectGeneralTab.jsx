import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { formatDate, formatCurrency, regionName } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, PoundSterling, Calendar, ExternalLink, UserCircle, Save, Loader2, Check } from "lucide-react";

function toDateInput(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toISOString().split("T")[0];
}

function fromDateInput(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toISOString();
}

export function ProjectGeneralTab({ project, accountMap }) {
  const { user } = useAuth();
  const role = user?.role || "client";
  const canEdit = ["admin", "director", "bdm"].includes(role);

  const [ribaDates, setRibaDates] = useState({
    riba1_end: toDateInput(project.riba1_end),
    riba2_end: toDateInput(project.riba2_end),
    riba3_end: toDateInput(project.riba3_end),
    riba4_end: toDateInput(project.riba4_end),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [staff, setStaff] = useState({ byAad: {}, byDv: {}, userRegion: {}, rds: [] });

  useEffect(() => {
    (async () => {
      const [contacts, users] = await Promise.all([
        listAll(base44.entities.Contact, "-full_name").catch(() => []),
        listAll(base44.entities.User).catch(() => []),
      ]);
      const byAad = {};
      const byDv = {};
      contacts.forEach((c) => { if (c.aad_id) byAad[c.aad_id] = c.full_name; if (c.dataverse_id) byDv[c.dataverse_id] = c.full_name; });
      users.forEach((u) => { if (!byAad[u.id]) byAad[u.id] = u.full_name || u.email; });
      const userRegion = {};
      users.forEach((u) => { if (u.id) userRegion[u.id] = u.data?.region || u.region || null; });
      const rds = users
        .filter((u) => u.role === "regional_director")
        .map((u) => ({ id: u.id, name: u.full_name || u.email, region: u.data?.region || u.region || null }));
      setStaff({ byAad, byDv, userRegion, rds });
    })();
  }, []);

  useEffect(() => {
    setRibaDates({
      riba1_end: toDateInput(project.riba1_end),
      riba2_end: toDateInput(project.riba2_end),
      riba3_end: toDateInput(project.riba3_end),
      riba4_end: toDateInput(project.riba4_end),
    });
  }, [project.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await base44.entities.Project.update(project.id, {
        riba1_end: fromDateInput(ribaDates.riba1_end),
        riba2_end: fromDateInput(ribaDates.riba2_end),
        riba3_end: fromDateInput(ribaDates.riba3_end),
        riba4_end: fromDateInput(ribaDates.riba4_end),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const client = accountMap[project.client_account_id];
  const bdmRegion = staff.userRegion[project.bdm_aad_id];
  const bsmRegion = staff.userRegion[project.bsm_aad_id];
  const bdmRd = bdmRegion ? staff.rds.find((r) => r.region === bdmRegion) : null;
  const bsmRd = bsmRegion ? staff.rds.find((r) => r.region === bsmRegion) : null;

  const ribaRows = [
    { stage: "RIBA 1", term: project.riba1_term_weeks, key: "riba1_end" },
    { stage: "RIBA 2", term: project.riba2_term_weeks, key: "riba2_end" },
    { stage: "RIBA 3", term: project.riba3_term_weeks, key: "riba3_end" },
    { stage: "RIBA 4", term: project.riba4_term_weeks, key: "riba4_end" },
  ];

  const links = [
    { label: "Legals Folder", url: project.link_to_legals },
    { label: "Project Questionnaire", url: project.link_to_project_questionnaire },
    { label: "PSO", url: project.link_to_pso },
    { label: "PCS", url: project.link_to_pcs },
  ].filter(l => l.url);

  return (
    <div className="space-y-6">
      {/* Key info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {client ? (
          <Link to={`/accounts/${client.id}`} className="block">
            <InfoCard icon={Building2} label="Client" value={client.name} />
          </Link>
        ) : (
          <InfoCard icon={Building2} label="Client" value="—" />
        )}
        <InfoCard icon={PoundSterling} label="Estimated Value" value={formatCurrency(project.estimated_value)} />
        <InfoCard icon={MapPin} label="Site Postcode" value={project.site_postcode || "—"} />
        <InfoCard icon={Calendar} label="Practical Completion" value={formatDate(project.practical_completion_date)} />
      </div>

      {/* Staff assignments */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Team Assignments</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Assignment label="BDM" name={staff.byAad[project.bdm_aad_id]} sub={<RegionSub region={bdmRegion} rd={bdmRd} />} />
          <Assignment label="BSM" name={staff.byAad[project.bsm_aad_id]} sub={<RegionSub region={bsmRegion} rd={bsmRd} />} />
          <Assignment label="Director" name={staff.byAad[project.director_aad_id]} />
          <Assignment label="Strategic Account Manager" name={staff.byAad[project.strategic_account_manager_aad_id]} />
          <Assignment label="Project Manager" name={staff.byDv[project.project_manager_id]} />
          <Assignment label="Client Representative" name={staff.byDv[project.client_rep_id]} />
        </div>
      </div>

      {/* RIBA timeframe grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">RIBA Timeframes</h3>
          {canEdit && (
            <div className="flex items-center gap-3">
              {saved && <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" /> Saved</span>}
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Save Dates
              </Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Term (Weeks)</th>
                <th className="pb-2">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ribaRows.map((r) => (
                <tr key={r.stage}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{r.stage}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{r.term || "—"}</td>
                  <td className="py-2.5">
                    {canEdit ? (
                      <input
                        type="date"
                        value={ribaDates[r.key]}
                        onChange={(e) => setRibaDates({ ...ribaDates, [r.key]: e.target.value })}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <span className="text-slate-600">{formatDate(project[r.key])}</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="py-2.5 pr-4 font-medium text-slate-900">Construction</td>
                <td className="py-2.5 pr-4 text-slate-600">{project.construction_term_weeks || "—"}</td>
                <td className="py-2.5 text-slate-600">{formatDate(project.practical_completion_date)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments & Links */}
      <div className="grid gap-4 lg:grid-cols-2">
        {project.comments && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Comments</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{project.comments}</p>
          </div>
        )}
        {links.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">SharePoint Links</h3>
            <div className="space-y-2">
              {links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional details */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Additional Details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Procurement Route" value={project.procurement_route ? "UK Leisure Framework" : "Other"} />
          <Detail label="Live Project" value={project.live_project ? "Yes" : "No"} />
          <Detail label="Approval Status" value={project.approval_status || "—"} />
          <Detail label="AA Executed" value={formatDate(project.aa_executed_date)} />
          <Detail label="PQ Approval" value={formatDate(project.pq_approval_date)} />
          <Detail label="Construction Term" value={project.construction_term_weeks ? `${project.construction_term_weeks} weeks` : "—"} />
          <Detail label="IE Value" value={formatCurrency(project.ie_value)} />
          <Detail label="IE Commencement" value={formatDate(project.ie_commencement_date)} />
          <Detail label="Payment Type" value={project.payment_type || "—"} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
function Assignment({ label, name, sub }) {
  return (
    <div className="flex items-start gap-2">
      <UserCircle className="mt-0.5 h-4 w-4 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-700">{name || "—"}</p>
        {sub}
      </div>
    </div>
  );
}
function RegionSub({ region, rd }) {
  return (
    <div className="text-xs text-slate-500">
      <span className="text-slate-400">Region </span>
      {region ? regionName(region) : <span className="text-amber-600">not set on profile</span>}
      <span className="text-slate-400"> · RD </span>
      {region ? (rd ? rd.name : <span className="text-amber-600">not assigned</span>) : "—"}
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || "—"}</p>
    </div>
  );
}