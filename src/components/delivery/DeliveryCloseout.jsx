import React from "react";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const TRACK = [
  { value: "outstanding", label: "Outstanding" },
  { value: "partial", label: "Partial" },
  { value: "complete", label: "Complete" },
];
const FINAL = [
  { value: "open", label: "Open" },
  { value: "agreed", label: "Agreed" },
  { value: "closed", label: "Closed" },
];

export function DeliveryCloseout({ delivery, setField, onSave, saving }) {
  return (
    <FormSection title="10 · Practical Completion & Close-out" description="Finish the lifecycle properly — PC, final account, handover and lessons learned">
      <div className="space-y-4">
        <FormGrid>
          <FormField label="PC achieved"><input type="date" value={delivery.pc_achieved ? String(delivery.pc_achieved).slice(0, 10) : ""} onChange={(e) => setField("pc_achieved", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="PC certificate (link)"><input value={delivery.pc_certificate || ""} onChange={(e) => setField("pc_certificate", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Final account status">
            <select value={delivery.final_account_status || ""} onChange={(e) => setField("final_account_status", e.target.value)} className={formInputClass}>
              <option value="">—</option>{FINAL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <FormField label="Defects period"><input value={delivery.defects_period || ""} onChange={(e) => setField("defects_period", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="Retention"><input value={delivery.retention || ""} onChange={(e) => setField("retention", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="O&M manuals">
            <select value={delivery.om_manuals || ""} onChange={(e) => setField("om_manuals", e.target.value)} className={formInputClass}><option value="">—</option>{TRACK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </FormField>
          <FormField label="Health & Safety file">
            <select value={delivery.hs_file || ""} onChange={(e) => setField("hs_file", e.target.value)} className={formInputClass}><option value="">—</option>{TRACK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </FormField>
          <FormField label="Warranties">
            <select value={delivery.warranties_status || ""} onChange={(e) => setField("warranties_status", e.target.value)} className={formInputClass}><option value="">—</option>{TRACK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </FormField>
          <FormField label="Training">
            <select value={delivery.training || ""} onChange={(e) => setField("training", e.target.value)} className={formInputClass}><option value="">—</option>{TRACK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </FormField>
          <FormField label="Asset information">
            <select value={delivery.asset_info || ""} onChange={(e) => setField("asset_info", e.target.value)} className={formInputClass}><option value="">—</option>{TRACK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </FormField>
          <FormField label="Client handover">
            <select value={delivery.client_handover || ""} onChange={(e) => setField("client_handover", e.target.value)} className={formInputClass}><option value="">—</option>{TRACK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </FormField>
          <FormField label="Lessons learned" ><textarea rows={3} value={delivery.lessons_learned || ""} onChange={(e) => setField("lessons_learned", e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField>
        </FormGrid>
        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save close-out
          </Button>
        </div>
      </div>
    </FormSection>
  );
}