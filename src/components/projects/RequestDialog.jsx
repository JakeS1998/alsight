import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { AccountCombobox } from "@/components/contacts/AccountCombobox";
import { LookupCombobox } from "@/components/forms/LookupCombobox";
import { REGION_OPTIONS } from "@/lib/portal";
import { Loader2 } from "lucide-react";
import ProjectBriefChat from '@/components/projects/ProjectBriefChat';
import useProjectBrief from '@/components/projects/useProjectBrief';
import useBDMRequestDefaults from '@/components/projects/useBDMRequestDefaults';
import RequestTimescales, { RIBA_TERMS } from '@/components/projects/RequestTimescales';
import RequestReviewHints from '@/components/projects/RequestReviewHints';

const EMPTY = {
  name: "", description: "",
  client_account_id: "",
  estimated_value: "", procurement_route: true,
  site_postcode: "", construction_term_weeks: "",
  ...Object.fromEntries(RIBA_TERMS.map(field => [field.key, ''])),
  bdm_aad_id: "", director_aad_id: "", department_id: "",
  link_to_legals: "", link_to_project_questionnaire: "", link_to_pso: "", link_to_pcs: "",
};

export function RequestDialog({ open, onOpenChange, accounts, users, user, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [bdmOptions, setBdmOptions] = useState([]);
  const [directorOptions, setDirectorOptions] = useState([]);

  const clientAccounts = accounts.filter((a) => a.account_type === "client");
  const [mode, setMode] = useState('alice');
  const [choicesReady, setChoicesReady] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const bdmDefaults = useBDMRequestDefaults({ setForm, setDirectorOptions });
  const brief = useProjectBrief({ form, setForm, onDirectorOption: bdmDefaults.addDirector, onComplete: () => setMode('review'), choices: {
    client_account_id: clientAccounts.map(account => ({ value: account.dataverse_id, label: account.name })),
    bdm_aad_id: bdmOptions, director_aad_id: directorOptions, department_id: REGION_OPTIONS,
  } });
  useEffect(() => { if (open) setMode('alice'); }, [open]);

  // Load BDM and Director lookup options (staff contacts + portal users).
  useEffect(() => {
    if (!open) return;
    setChoicesReady(false);
    let cancelled = false;
    (async () => {
      const [bdmC, dirC] = await Promise.all([
        filterAll(base44.entities.Contact, { portal_role: "bdm" }, "full_name").catch(() => []),
        filterAll(base44.entities.Contact, { portal_role: "director" }, "full_name").catch(() => []),
      ]);
      if (cancelled) return;
      const toOpts = (arr) => arr.map((c) => ({ value: c.aad_id, label: c.full_name })).filter((o) => o.value);
      const bdmMap = new Map();
      toOpts(bdmC).forEach((o) => bdmMap.set(o.value, o));
      (users || []).filter((u) => u.role === "bdm").forEach((u) => bdmMap.set(u.id, { value: u.id, label: u.full_name || u.email }));
      setBdmOptions([...bdmMap.values()].sort((a, b) => a.label.localeCompare(b.label)));
      const dirMap = new Map();
      toOpts(dirC).forEach((o) => dirMap.set(o.value, o));
      (users || []).filter((u) => u.role === "director").forEach((u) => dirMap.set(u.id, { value: u.id, label: u.full_name || u.email }));
      setDirectorOptions([...dirMap.values()].sort((a, b) => a.label.localeCompare(b.label)));
      setChoicesReady(true);
    })();
    return () => { cancelled = true; };
  }, [open, users]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const briefFileUri = await brief.archive(user);
      await base44.entities.Project.create({
        ...(briefFileUri ? { request_brief_file_uri: briefFileUri } : {}),
        name: form.name.trim(),
        description: form.description.trim(),
        project_number: "",
        client_account_id: form.client_account_id || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        procurement_route: form.procurement_route,
        site_postcode: form.site_postcode.trim() || null,
        construction_term_weeks: form.construction_term_weeks !== '' ? Number(form.construction_term_weeks) : null,
        ...Object.fromEntries(RIBA_TERMS.map(field => [field.key, form[field.key] !== '' ? Number(form[field.key]) : null])),
        bdm_aad_id: form.bdm_aad_id || null,
        director_aad_id: form.director_aad_id || null,
        department_id: form.department_id || null,
        link_to_legals: form.link_to_legals.trim() || null,
        link_to_project_questionnaire: form.link_to_project_questionnaire.trim() || null,
        link_to_pso: form.link_to_pso.trim() || null,
        link_to_pcs: form.link_to_pcs.trim() || null,
        live_project: true,
        status: "active",
      });
      setForm(EMPTY);
      brief.reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      setSubmitError(error.message || 'Unable to submit the project request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!submitting) onOpenChange(value); }}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>{mode === 'review' ? 'Review your project request' : 'Request a new project'}</DialogTitle>
          <DialogDescription>{mode === 'review' ? 'ALICE has filled in your draft. Check and change any details below, then confirm to submit your request. Nothing has been submitted yet.' : 'Submit a leisure construction project request for director review.'}</DialogDescription>
        </DialogHeader>
        {mode === 'alice' ? <ProjectBriefChat brief={brief} ready={choicesReady} onManual={() => setMode('manual')} onReview={() => setMode('review')} /> : <form onSubmit={submit} className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <button type="button" onClick={() => setMode('alice')} className="shrink-0 text-left text-sm font-medium text-foreground underline underline-offset-4">Back to ALICE</button>
          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-1">
          <FormSection title="Project Details" description="Describe the leisure construction or refurbishment project">
            <div className="space-y-4">
              <FormField label="Project name" required>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={formInputClass} />
              </FormField>
              <FormField label="Description">
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${formInputClass} h-auto py-2`} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Client & Budget" description="Link the client and estimated project value">
            <FormGrid>
              <FormField label="Client">
                <AccountCombobox
                  value={form.client_account_id}
                  onChange={(v) => setForm({ ...form, client_account_id: v })}
                  accounts={clientAccounts}
                  placeholder="— Select client —"
                />
              </FormField>
              <FormField label="Estimated Value (£)">
                <input type="number" min="0" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Procurement Route">
                <select value={form.procurement_route} onChange={(e) => setForm({ ...form, procurement_route: e.target.value === "true" })} className={formInputClass}>
                  <option value="true">Framework</option>
                  <option value="false">Direct</option>
                </select>
              </FormField>
            </FormGrid>
          </FormSection>

          <RequestTimescales form={form} setForm={setForm} />

          <FormSection title="Team & Region" description="Select the BDM to populate Director and region automatically">
            <FormGrid>
              <FormField label="BDM">
                <LookupCombobox
                  value={form.bdm_aad_id}
                  onChange={bdmDefaults.choose}
                  options={bdmOptions}
                  placeholder="— Select BDM —"
                  searchPlaceholder="Search BDMs..."
                />
              </FormField>
              <FormField label="Director">
                <LookupCombobox
                  value={form.director_aad_id}
                  onChange={(v) => setForm({ ...form, director_aad_id: v })}
                  options={directorOptions}
                  placeholder="— Select director —"
                  searchPlaceholder="Search directors..."
                />
              </FormField>
              <FormField label="Region">
                <LookupCombobox
                  value={form.department_id}
                  onChange={(v) => setForm({ ...form, department_id: v })}
                  options={REGION_OPTIONS}
                  placeholder="— Select region —"
                  searchPlaceholder="Search regions..."
                />
              </FormField>
            </FormGrid>
            {bdmDefaults.loading ? <p role="status" className="mt-3 text-sm text-muted-foreground">Looking up Director and region…</p> : bdmDefaults.notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{bdmDefaults.notice}</p>}
          </FormSection>

          <FormSection title="SharePoint Links" description="Paste relevant SharePoint document links">
            <div className="space-y-4">
              <FormField label="Link to legals">
                <input value={form.link_to_legals} onChange={(e) => setForm({ ...form, link_to_legals: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Link to project questionnaire">
                <input value={form.link_to_project_questionnaire} onChange={(e) => setForm({ ...form, link_to_project_questionnaire: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Link to PSO">
                <input value={form.link_to_pso} onChange={(e) => setForm({ ...form, link_to_pso: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Link to PCS">
                <input value={form.link_to_pcs} onChange={(e) => setForm({ ...form, link_to_pcs: e.target.value })} className={formInputClass} />
              </FormField>
            </div>
          </FormSection>

          </div>
          {brief.messages.length > 1 && <RequestReviewHints form={form} confirmed={brief.confirmed} />}
          <DialogFooter className="shrink-0 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || bdmDefaults.loading} className="bg-primary hover:bg-primary/90">
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} {mode === 'review' ? 'Confirm and submit request' : 'Submit request'}
            </Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}