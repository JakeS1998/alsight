import React from "react";
import { formatDate, formatCurrency } from "@/lib/portal";
import { Building2, MapPin, PoundSterling, Calendar, ExternalLink, UserCircle } from "lucide-react";

export function ProjectGeneralTab({ project, accountMap }) {
  const client = accountMap[project.client_account_id];
  const supplier = accountMap[project.account_id];

  const ribaRows = [
    { stage: "RIBA 1", term: project.riba1_term_weeks, end: project.riba1_end, sys: project.riba1_system_date },
    { stage: "RIBA 2", term: project.riba2_term_weeks, end: project.riba2_end, sys: project.riba2_system_date },
    { stage: "RIBA 3", term: project.riba3_term_weeks, end: project.riba3_end, sys: project.riba3_system_date },
    { stage: "RIBA 4", term: project.riba4_term_weeks, end: project.riba4_end, sys: project.riba4_system_date },
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
        <InfoCard icon={Building2} label="Client" value={client?.name || "—"} />
        <InfoCard icon={PoundSterling} label="Estimated Value" value={formatCurrency(project.estimated_value)} />
        <InfoCard icon={MapPin} label="Site Postcode" value={project.site_postcode || "—"} />
        <InfoCard icon={Calendar} label="Practical Completion" value={formatDate(project.practical_completion_date)} />
      </div>

      {/* Staff assignments */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Team Assignments</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Assignment label="BDM" value={project.bdm_aad_id ? "Assigned" : "—"} />
          <Assignment label="BSM" value={project.bsm_aad_id ? "Assigned" : "—"} />
          <Assignment label="Director" value={project.director_aad_id ? "Assigned" : "—"} />
          <Assignment label="Strategic Account Manager" value={project.strategic_account_manager_aad_id ? "Assigned" : "—"} />
          <Assignment label="Project Manager" value={project.project_manager_id ? "Assigned" : "—"} />
          <Assignment label="Client Representative" value={project.client_rep_id ? "Assigned" : "—"} />
        </div>
      </div>

      {/* RIBA timeframe grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">RIBA Timeframes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Term (Weeks)</th>
                <th className="pb-2 pr-4">End Date</th>
                <th className="pb-2">System Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ribaRows.map((r) => (
                <tr key={r.stage}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{r.stage}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{r.term || "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{formatDate(r.end)}</td>
                  <td className="py-2.5 text-slate-600">{r.sys || "—"}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="py-2.5 pr-4 font-medium text-slate-900">Construction</td>
                <td className="py-2.5 pr-4 text-slate-600">{project.construction_term_weeks || "—"}</td>
                <td className="py-2.5 pr-4 text-slate-600">{formatDate(project.practical_completion_date)}</td>
                <td className="py-2.5 text-slate-600">{project.riba5_system_date || "—"}</td>
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
function Assignment({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-4 w-4 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
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