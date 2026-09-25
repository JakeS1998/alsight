import React from "react";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { DropdownWithNotes } from "./DropdownWithNotes";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, MapPin, PoundSterling, User } from "lucide-react";
import { formatCurrency } from "@/lib/portal";

const FUNDING = ["UK Leisure Framework", "Local Authority Capital", "Sport England", "Salix", "Section 106", "Other"];
const FEASIBILITY = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

export function DeliveryScoping({ project, accountMap, bdmName, delivery, setField, onSave, saving }) {
  return (
    <FormSection title="1 · Opportunity & Scoping" description="Existing project info is shown read-only; supplementary scoping fields are editable">
      <div className="space-y-5">
        <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadOnly icon={<Building2 className="h-3.5 w-3.5" />} label="Client / authority" value={accountMap[project.client_account_id]?.name || project.client_name || "—"} />
          <ReadOnly icon={<MapPin className="h-3.5 w-3.5" />} label="Site" value={project.site_postcode || "—"} />
          <ReadOnly icon={<PoundSterling className="h-3.5 w-3.5" />} label="Indicative value" value={formatCurrency(project.estimated_value)} />
          <ReadOnly icon={<User className="h-3.5 w-3.5" />} label="BDM owner" value={bdmName || "—"} />
        </div>

        <FormGrid>
          <DropdownWithNotes label="Funding route" value={delivery.funding_route} onChange={(v) => setField("funding_route", v)} options={FUNDING} notes={delivery.funding_route_notes} onNotesChange={(v) => setField("funding_route_notes", v)} />
          <FormField label="Project type">
            <input value={project.description || ""} disabled className={`${formInputClass} bg-slate-50 text-slate-500`} />
          </FormField>
          <DropdownWithNotes label="Feasibility / options appraisal" value={delivery.feasibility_status} onChange={(v) => setField("feasibility_status", v)} options={FEASIBILITY} notes={delivery.feasibility_notes} onNotesChange={(v) => setField("feasibility_notes", v)} />
          <FormField label="Probability / confidence (%)">
            <input type="number" min="0" max="100" value={delivery.probability ?? ""} onChange={(e) => setField("probability", e.target.value)} className={formInputClass} />
          </FormField>
          <FormField label="Site visit completed?">
            <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!delivery.site_visit_completed} onChange={(e) => setField("site_visit_completed", e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-primary" />
              Completed
            </label>
          </FormField>
          <FormField label="Target programme">
            <input value={delivery.target_programme || ""} onChange={(e) => setField("target_programme", e.target.value)} className={formInputClass} />
          </FormField>
          <FormField label="Scope summary">
            <textarea rows={2} value={delivery.scope_summary || ""} onChange={(e) => setField("scope_summary", e.target.value)} className={`${formInputClass} h-auto py-2`} />
          </FormField>
          <FormField label="Client objectives">
            <textarea rows={2} value={delivery.client_objectives || ""} onChange={(e) => setField("client_objectives", e.target.value)} className={`${formInputClass} h-auto py-2`} />
          </FormField>
          <FormField label="Initial constraints">
            <textarea rows={2} value={delivery.initial_constraints || ""} onChange={(e) => setField("initial_constraints", e.target.value)} className={`${formInputClass} h-auto py-2`} />
          </FormField>
          <FormField label="Key stakeholders">
            <textarea rows={2} value={delivery.key_stakeholders || ""} onChange={(e) => setField("key_stakeholders", e.target.value)} className={`${formInputClass} h-auto py-2`} />
          </FormField>
          <FormField label="Next action">
            <input value={delivery.next_action || ""} onChange={(e) => setField("next_action", e.target.value)} className={formInputClass} />
          </FormField>
        </FormGrid>

        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save scoping
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

function ReadOnly({ icon, label, value }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{icon}{label}</div>
      <div className="text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}