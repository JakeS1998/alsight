import React, { useState } from "react";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { DropdownWithNotes } from "./DropdownWithNotes";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AutomatedBuildField from '@/components/delivery/AutomatedBuildField';
import ConstructionLADTerms from '@/components/delivery/ConstructionLADTerms';
import { constructionAutomation } from '@/components/delivery/constructionAutomation';
import { formatCurrency } from '@/lib/portal';

const EOT = ["None", "Requested", "Agreed", "Disputed", "N/A"];
const LAD = ["None", "Potential", "Low", "Medium", "High"];

export function DeliveryConstruction({ project, delivery, setField, onSave, saving }) {
  const automation = constructionAutomation(project, delivery);
  const [error, setError] = useState('');
  const save = async () => { setError(''); try { await onSave(); } catch (failure) { setError(failure.message || 'Unable to save construction.'); } };
  return (
    <FormSection title="09 · Build" description="Client-side headline information once the project reaches site">
      <div className="space-y-4">
        <FormGrid>
          <FormField label="Contract sum (£)"><input type="number" value={delivery.contract_sum ?? ""} onChange={(e) => setField("contract_sum", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Contractor"><input value={delivery.contractor || ""} onChange={(e) => setField("contractor", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Contract start"><input type="date" value={delivery.contract_start ? String(delivery.contract_start).slice(0, 10) : ""} onChange={(e) => setField("contract_start", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Original PC date"><input type="date" value={delivery.original_pc ? String(delivery.original_pc).slice(0, 10) : ""} onChange={(e) => setField("original_pc", e.target.value)} className={formInputClass} /></FormField>
          <AutomatedBuildField label="Forecast PC date" field="forecast_pc" type="date" value={automation.forecast_pc} delivery={delivery} setField={setField} help="Main-page construction completion date, otherwise expected completion." />
          <FormField label="Indicative LAD exposure (£)"><input aria-label="Indicative LAD exposure (£)" readOnly value={automation.amount == null ? 'Not estimated' : formatCurrency(automation.amount)} className={formInputClass} /><p className="mt-1 text-xs text-muted-foreground">Calculated using the existing LAD rate and completion dates; stored when you select Save construction.</p></FormField>
          <FormField label="Current valuation (£)"><input type="number" value={delivery.current_valuation ?? ""} onChange={(e) => setField("current_valuation", e.target.value)} className={formInputClass} /></FormField>
          <AutomatedBuildField label="% programme complete" field="pct_programme" type="number" value={automation.pct_programme} delivery={delivery} setField={setField} help="Time elapsed between main-page RIBA 4 completion and expected construction completion, capped at 0–100%; not measured site progress." />
          <FormField label="% cost complete"><input type="number" min="0" max="100" value={delivery.pct_cost ?? ""} onChange={(e) => setField("pct_cost", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Variations"><input value={delivery.variations || ""} onChange={(e) => setField("variations", e.target.value)} className={formInputClass} /></FormField>
          <DropdownWithNotes label="EOT" value={delivery.eot} onChange={(v) => setField("eot", v)} options={EOT} notes={delivery.eot_notes} onNotesChange={(v) => setField("eot_notes", v)} />
          <div className="space-y-2"><AutomatedBuildField label="LAD exposure" field="lad_exposure" options={LAD} value={automation.lad_exposure} delivery={delivery} setField={setField} help="Potential where the recorded rate and forecast/actual delay give a positive estimate; otherwise None." /><FormField label="LAD exposure commentary"><textarea rows={2} value={delivery.lad_exposure_notes || ''} onChange={e => setField('lad_exposure_notes', e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField></div>
          <FormField label="Last progress meeting"><input type="date" value={delivery.last_progress_meeting ? String(delivery.last_progress_meeting).slice(0, 10) : ""} onChange={(e) => setField("last_progress_meeting", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Next progress meeting"><input type="date" value={delivery.next_progress_meeting ? String(delivery.next_progress_meeting).slice(0, 10) : ""} onChange={(e) => setField("next_progress_meeting", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Key site issues"><textarea rows={2} value={delivery.key_site_issues || ""} onChange={(e) => setField("key_site_issues", e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField>
        </FormGrid>
        <ConstructionLADTerms delivery={delivery} setField={setField} automation={automation} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save construction
          </Button>
        </div>
      </div>
    </FormSection>
  );
}