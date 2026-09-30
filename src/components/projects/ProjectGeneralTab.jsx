import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import ValuationSnapshot from '@/components/valuations/ValuationSnapshot';
import ProjectPOReferences from '@/components/projects/ProjectPOReferences';
import StageDrawing from '@/components/projects/StageDrawing';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import ProjectDocumentStatuses from '@/components/projects/ProjectDocumentStatuses';
import { projectStaffName } from '@/components/projects/projectStaffName';
import { formatDate, formatCurrency, regionName, INTERNAL_ROLES } from "@/lib/portal";
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

export function ProjectGeneralTab({ project, accountMap, onProjectUpdated }) {
  const { user } = useAuth();
  const role = user?.role || "client";
  const canEdit = ["admin", "director", "bdm", "project_manager"].includes(role) || (role === 'supplier' && !!project.can_submit_valuation);

  const [ribaDates, setRibaDates] = useState({
    riba1_end: toDateInput(project.riba1_end),
    riba2_end: toDateInput(project.riba2_end),
    riba3_end: toDateInput(project.riba3_end),
    riba4_end: toDateInput(project.riba4_end),
    practical_completion_date: toDateInput(project.practical_completion_date),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [staff, setStaff] = useState({ byAad: {}, byDv: {} });
  const [directorName, setDirectorName] = useState('');

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
      setStaff({ byAad, byDv });
    })();
  }, []);

  useEffect(() => {
    setRibaDates({
      riba1_end: toDateInput(project.riba1_end),
      riba2_end: toDateInput(project.riba2_end),
      riba3_end: toDateInput(project.riba3_end),
      riba4_end: toDateInput(project.riba4_end),
    practical_completion_date: toDateInput(project.practical_completion_date),
    });
  }, [project.id]);

  useEffect(() => {
    let active = true;
    setDirectorName('');
    base44.functions.invoke('getProjectBDMManager', { projectId: project.id })
      .then(({ data }) => { if (active) setDirectorName(data.managerName || ''); })
      .catch(() => { if (active) setDirectorName(''); });
    return () => { active = false; };
  }, [project.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      const dates = Object.fromEntries(Object.entries(ribaDates).map(([key, value]) => [key, value || null]));
      const updated = role === 'project_manager' || role === 'supplier'
        ? (await base44.functions.invoke('manageValuation', { action: 'riba_dates', projectId: project.id, ...dates })).data.project
        : await base44.entities.Project.update(project.id, Object.fromEntries(Object.entries(ribaDates).map(([key, value]) => [key, fromDateInput(value)])));
      onProjectUpdated?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error.response?.data?.error || error.message || 'Unable to save dates');
    } finally {
      setSaving(false);
    }
  };

  const client = accountMap[project.client_account_id];

  const expectedDates = projectCompletionDates(project);
  const ribaRows = [
    { stage: "RIBA 1", term: project.riba1_term_weeks, key: "riba1_end", expected: expectedDates.riba1_system_date },
    { stage: "RIBA 2", term: project.riba2_term_weeks, key: "riba2_end", expected: expectedDates.riba2_system_date },
    { stage: "RIBA 3", term: project.riba3_term_weeks, key: "riba3_end", expected: expectedDates.riba3_system_date },
    { stage: "RIBA 4", term: project.riba4_term_weeks, key: "riba4_end", expected: expectedDates.riba4_system_date },
  ];

  const links = [
    { label: "Legals Folder", url: project.link_to_legals },
    { label: "Project Questionnaire", url: project.link_to_project_questionnaire },
    { label: "PSO", url: project.link_to_pso },
    { label: "PCS", url: project.link_to_pcs },
  ].filter(l => l.url);

  return (
    <div className="space-y-6">
      {INTERNAL_ROLES.includes(role) && <ValuationSnapshot project={project} />}
      {INTERNAL_ROLES.includes(role) && <><div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="mb-2 font-semibold text-slate-900">Project references</h3><p className="text-sm text-slate-600">Legal project: {project.project_number || '—'}</p><ProjectPOReferences project={project} compact /></div></>}
      {/* Key info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {client ? (
          <Link to={`/accounts/${client.id}`} className="block">
            <InfoCard icon={Building2} label="Client" value={client.name} />
          </Link>
        ) : (
          <InfoCard icon={Building2} label="Client" value={project.client_name || '—'} />
        )}
        {role !== 'supplier' && role !== 'project_manager' && <InfoCard icon={PoundSterling} label="Estimated Value" value={formatCurrency(project.estimated_value)} />}
        <InfoCard icon={MapPin} label="Department" value={regionName(project.department_id) || '—'} />
        <InfoCard icon={Calendar} label="Construction Actual Completion" value={formatDate(project.practical_completion_date)} />
      </div>

      {/* Staff assignments */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Team Assignments</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Assignment label="BDM" name={projectStaffName(project.bdm_aad_id, staff.byAad)} />
          <Assignment label="BSM" name={projectStaffName(project.bsm_aad_id, staff.byAad) || (project.bsm_aad_id ? "Assigned BSM not identified" : null)} />
          <Assignment label="Director" name={directorName} />
          <Assignment label="Project postcode" name={project.site_postcode} />
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
              {saveError && <span role="alert" className="text-xs text-destructive">{saveError}</span>}
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
                <th className="pb-2 pr-4">Expected Completion</th>
                <th className="pb-2">Actual Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ribaRows.map((r) => (
                <tr key={r.stage}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900"><span className="inline-flex items-center gap-2"><StageDrawing stage={r.stage} className="h-10 w-10" />{r.stage}</span></td>
                  <td className="py-2.5 pr-4 text-slate-600">{r.term || "—"}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground" title="System date — read only">{formatDate(r.expected)}</td>
                  <td className="py-2.5">
                    {canEdit ? (
                      <input
                        type="date"
                        aria-label={`${r.stage} Actual Completion`}
                        disabled={saving}
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
                <td className="py-2.5 pr-4 font-medium text-slate-900"><span className="inline-flex items-center gap-2"><StageDrawing stage="RIBA 5–7" className="h-10 w-10" />Construction</span></td>
                <td className="py-2.5 pr-4 text-slate-600">{project.construction_term_weeks || "—"}</td>
                <td className="py-2.5 pr-4 text-muted-foreground" title="System date — read only">{formatDate(expectedDates.riba5_system_date)}</td>
                <td className="py-2.5">
                  {canEdit ? (
                    <input
                      type="date"
                      aria-label="Construction Actual Completion"
                      disabled={saving}
                      value={ribaDates.practical_completion_date}
                      onChange={(e) => setRibaDates({ ...ribaDates, practical_completion_date: e.target.value })}
                      className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : <span className="text-slate-600">{formatDate(project.practical_completion_date)}</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {(role === 'project_manager' || (role === 'supplier' && project.can_submit_valuation)) && <ProjectDocumentStatuses projectId={project.id} />}

      {/* Comments & Links */}
      {role !== 'supplier' && role !== 'project_manager' && <div className="grid gap-4 lg:grid-cols-2">
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
      </div>}

      {/* Additional details */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Additional Details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Procurement Route" value={project.procurement_route === true ? "Framework" : project.procurement_route === false ? "Direct" : "—"} />
          <Detail label="Live Project" value={project.live_project ? "Yes" : "No"} />
          <Detail label="Approval Status" value={project.approval_status || "—"} />
          <Detail label="AA Executed" value={formatDate(project.aa_executed_date)} />
          <Detail label="PQ Approval" value={formatDate(project.pq_approval_date)} />
          <Detail label="Construction Term" value={project.construction_term_weeks ? `${project.construction_term_weeks} weeks` : "—"} />
          {role !== 'supplier' && role !== 'project_manager' && <><Detail label="IE Value" value={formatCurrency(project.ie_value)} />
          <Detail label="IE Commencement" value={formatDate(project.ie_commencement_date)} />
          <Detail label="Payment Type" value={project.payment_type || "—"} /></>}
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
function Assignment({ label, name }) {
  return (
    <div className="flex items-start gap-2">
      <UserCircle className="mt-0.5 h-4 w-4 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-700">{name || "—"}</p>
      </div>
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