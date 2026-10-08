import React, { useState, useEffect, useContext } from "react";
import DataverseEditContext from '@/components/dataverse/DataverseEditContext';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';

import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import useProjectAssignmentPeople from '@/components/projects/useProjectAssignmentPeople';
import ValuationSnapshot from '@/components/valuations/ValuationSnapshot';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import ProjectDocumentStatuses from '@/components/projects/ProjectDocumentStatuses';
import Project360Strip from '@/components/projects/Project360Strip';
import ProjectWorkspaceFields from '@/components/projects/ProjectWorkspaceFields';
import ProjectWorkspaceDates from '@/components/projects/ProjectWorkspaceDates';
import ProjectBriefHistory from '@/components/projects/ProjectBriefHistory';
import useProjectTeamAssignments from '@/components/projects/useProjectTeamAssignments';
import { formatDate, formatCurrency, regionName, INTERNAL_ROLES } from "@/lib/portal";
import { ExternalLink } from "lucide-react";

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

export function ProjectGeneralTab({ project, accountMap, onProjectUpdated, singleTask = false, legalDocs = [], jcts = [] }) {
  const { user } = useAuth();
  const { mappedFields = [] } = useContext(DataverseEditContext) || {};
  const teamAssignments = useProjectTeamAssignments({ project, accountMap, legalDocs, jcts });
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
  const people = useProjectAssignmentPeople(project);

  useEffect(() => {
    setRibaDates({
      riba1_end: toDateInput(project.riba1_end),
      riba2_end: toDateInput(project.riba2_end),
      riba3_end: toDateInput(project.riba3_end),
      riba4_end: toDateInput(project.riba4_end),
    practical_completion_date: toDateInput(project.practical_completion_date),
    });
  }, [project.id, project.riba1_end, project.riba2_end, project.riba3_end, project.riba4_end, project.practical_completion_date]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      const dateEntries = Object.entries(ribaDates).filter(([key]) => (!singleTask || key === 'practical_completion_date') && !mappedFields.includes(key));
      const dates = Object.fromEntries(dateEntries.map(([key, value]) => [key, value || null]));
      const updated = role === 'project_manager' || role === 'supplier'
        ? (await base44.functions.invoke('manageValuation', { action: 'riba_dates', projectId: project.id, ...dates })).data.project
        : await base44.entities.Project.update(project.id, Object.fromEntries(dateEntries.map(([key, value]) => [key, fromDateInput(value)])));
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
  const ribaRows = singleTask ? [] : [
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
    <div className="ws-general">
      {INTERNAL_ROLES.includes(role) && <Project360Strip project={project} singleTask={singleTask} onProjectUpdated={onProjectUpdated} />}
      <ProjectWorkspaceFields
        summary={[
          { label: 'Client', value: client?.name || project.client_name || '—', to: client ? `/accounts/${client.id}` : undefined },
          ...(role !== 'supplier' && role !== 'project_manager' ? [{ label: 'Estimated Value', value: formatCurrency(project.estimated_value) }] : []),
          { label: 'Department', value: regionName(project.department_id) || '—' },
          { label: singleTask ? 'Task completion' : 'Construction Actual Completion', value: formatDate(project.practical_completion_date) },
          { label: 'Project postcode', value: project.site_postcode || '—' },
        ]}
        assignments={[
          ['BDM', people.staffName(project.bdm_aad_id)],
          ['BSM', people.staffName(project.bsm_aad_id)],
          ['Director', people.directorName],
          ['Project Manager', people.contactName(project.project_manager_id) || teamAssignments.names['Project Manager']],
          ['Client Representative', people.contactName(project.client_rep_id)],
          ...teamAssignments.assignments,
        ]}
        details={[
          { title: 'Commercial', fields: [
            ['Procurement Route', project.procurement_route === true ? 'Framework' : project.procurement_route === false ? 'Direct' : '—'],
            ...(role !== 'supplier' && role !== 'project_manager' ? [['IE Value', formatCurrency(project.ie_value)], ['Payment Type', project.payment_type || '—']] : []),
          ] },
          { title: 'Programme', fields: [
            ['Construction Term', project.construction_term_weeks ? `${project.construction_term_weeks} weeks` : '—'],
            ...(role !== 'supplier' && role !== 'project_manager' ? [['IE Commencement', formatDate(project.ie_commencement_date)]] : []),
            ['Live Project', project.live_project ? 'Yes' : 'No'],
          ] },
          { title: 'Governance', fields: [
            ['Approval Status', project.approval_status || '—'],
            ['AA Executed', formatDate(project.aa_executed_date)],
            ['PQ Approval', formatDate(project.pq_approval_date)],
          ] },
        ]}
      />
      <ProjectWorkspaceDates project={project} singleTask={singleTask} ribaRows={ribaRows} expectedDates={expectedDates} ribaDates={ribaDates} setRibaDates={setRibaDates} canEdit={canEdit} saving={saving} saved={saved} saveError={saveError} onSave={handleSave} />

      {INTERNAL_ROLES.includes(role) && <ValuationSnapshot project={project} />}
      {INTERNAL_ROLES.includes(role) && project.request_brief_file_uri && <ProjectBriefHistory fileUri={project.request_brief_file_uri} />}
      {(role === 'project_manager' || (role === 'supplier' && project.can_submit_valuation)) && <ProjectDocumentStatuses projectId={project.id} projectNumber={project.project_number} />}

      {/* Comments, additional details and links */}
      <div className={role !== 'supplier' && role !== 'project_manager' ? 'ws-grid2' : 'space-y-6'}>
        {role !== 'supplier' && role !== 'project_manager' && project.comments && (
          <div className="ws-card ws-panel">
            <h3 className="ws-sectiontitle mb-4">Comments</h3>
            <InlineDataverseField field="comments"><p className="text-sm text-slate-600 whitespace-pre-line">{project.comments}</p></InlineDataverseField>
          </div>
        )}
        {role !== 'supplier' && role !== 'project_manager' && links.length > 0 && (
          <div className="ws-card ws-panel">
            <h3 className="ws-sectiontitle mb-4">SharePoint Links</h3>
            <div className="space-y-2">
              {links.map((l) => (
                <InlineDataverseField key={l.label} label={l.label}><a href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> {l.label}
                </a></InlineDataverseField>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}