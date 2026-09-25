import React from "react";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function DeliveryConstruction({ delivery, setField, onSave, saving }) {
  return (
    <FormSection title="9 · Construction" description="Client-side headline information once the project reaches site">
      <div className="space-y-4">
        <FormGrid>
          <FormField label="Contract sum (£)"><input type="number" value={delivery.contract_sum ?? ""} onChange={(e) => setField("contract_sum", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Contractor"><input value={delivery.contractor || ""} onChange={(e) => setField("contractor", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Contract start"><input type="date" value={delivery.contract_start ? String(delivery.contract_start).slice(0, 10) : ""} onChange={(e) => setField("contract_start", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Original PC date"><input type="date" value={delivery.original_pc ? String(delivery.original_pc).slice(0, 10) : ""} onChange={(e) => setField("original_pc", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Forecast PC date"><input type="date" value={delivery.forecast_pc ? String(delivery.forecast_pc).slice(0, 10) : ""} onChange={(e) => setField("forecast_pc", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Current valuation (£)"><input type="number" value={delivery.current_valuation ?? ""} onChange={(e) => setField("current_valuation", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="% programme complete"><input type="number" min="0" max="100" value={delivery.pct_programme ?? ""} onChange={(e) => setField("pct_programme", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="% cost complete"><input type="number" min="0" max="100" value={delivery.pct_cost ?? ""} onChange={(e) => setField("pct_cost", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Variations"><input value={delivery.variations || ""} onChange={(e) => setField("variations", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="EOT"><input value={delivery.eot || ""} onChange={(e) => setField("eot", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="LAD exposure"><input value={delivery.lad_exposure || ""} onChange={(e) => setField("lad_exposure", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Last progress meeting"><input type="date" value={delivery.last_progress_meeting ? String(delivery.last_progress_meeting).slice(0, 10) : ""} onChange={(e) => setField("last_progress_meeting", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Next progress meeting"><input type="date" value={delivery.next_progress_meeting ? String(delivery.next_progress_meeting).slice(0, 10) : ""} onChange={(e) => setField("next_progress_meeting", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Key site issues" ><textarea rows={2} value={delivery.key_site_issues || ""} onChange={(e) => setField("key_site_issues", e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField>
        </FormGrid>
        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save construction
          </Button>
        </div>
      </div>
    </FormSection>
  );
}