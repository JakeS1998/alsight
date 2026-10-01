import React from "react";
import { FormSection, FormField, formInputClass } from "@/components/forms/PowerForm";
import ScopingFields from '@/components/delivery/ScopingFields';
import { Button } from "@/components/ui/button";
import { Loader2, Building2, MapPin, PoundSterling, User } from "lucide-react";
import { formatCurrency } from "@/lib/portal";



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

        <ScopingFields value={delivery} setField={setField}>
          <FormField label="Project type"><input value={project.description || ''} disabled className={`${formInputClass} bg-slate-50 text-slate-500`} /></FormField>
        </ScopingFields>

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