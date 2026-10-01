import React from "react";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { DropdownWithNotes } from "./DropdownWithNotes";
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
const DEFECTS = ["6 months", "12 months", "24 months", "Other"];
const RETENTION = ["0%", "2.5%", "3%", "5%", "Other"];

export function DeliveryCloseout({ delivery, setField, onSave, saving, children }) {
  return (
    <FormSection title="10 · Practical Completion & Close-out" description="Finish the lifecycle properly — PC, final account, handover and lessons learned">
      <div className="space-y-4">
        <FormGrid>
          <FormField label="PC achieved"><input type="date" value={delivery.pc_achieved ? String(delivery.pc_achieved).slice(0, 10) : ""} onChange={(e) => setField("pc_achieved", e.target.value)} className={formInputClass} /></FormField>
          <FormField label="PC certificate (link)"><input value={delivery.pc_certificate || ""} onChange={(e) => setField("pc_certificate", e.target.value)} className={formInputClass} /></FormField>
          <DropdownWithNotes label="Final account status" value={delivery.final_account_status} onChange={(v) => setField("final_account_status", v)} options={FINAL} notes={delivery.final_account_notes} onNotesChange={(v) => setField("final_account_notes", v)} />
          <DropdownWithNotes label="Defects period" value={delivery.defects_period} onChange={(v) => setField("defects_period", v)} options={DEFECTS} notes={delivery.defects_period_notes} onNotesChange={(v) => setField("defects_period_notes", v)} />
          <DropdownWithNotes label="Retention" value={delivery.retention} onChange={(v) => setField("retention", v)} options={RETENTION} notes={delivery.retention_notes} onNotesChange={(v) => setField("retention_notes", v)} />
          <DropdownWithNotes label="O&M manuals" value={delivery.om_manuals} onChange={(v) => setField("om_manuals", v)} options={TRACK} notes={delivery.om_manuals_notes} onNotesChange={(v) => setField("om_manuals_notes", v)} />
          <DropdownWithNotes label="Health & Safety file" value={delivery.hs_file} onChange={(v) => setField("hs_file", v)} options={TRACK} notes={delivery.hs_file_notes} onNotesChange={(v) => setField("hs_file_notes", v)} />
          <DropdownWithNotes label="Warranties" value={delivery.warranties_status} onChange={(v) => setField("warranties_status", v)} options={TRACK} notes={delivery.warranties_status_notes} onNotesChange={(v) => setField("warranties_status_notes", v)} />
          <DropdownWithNotes label="Training" value={delivery.training} onChange={(v) => setField("training", v)} options={TRACK} notes={delivery.training_notes} onNotesChange={(v) => setField("training_notes", v)} />
          <DropdownWithNotes label="Asset information" value={delivery.asset_info} onChange={(v) => setField("asset_info", v)} options={TRACK} notes={delivery.asset_info_notes} onNotesChange={(v) => setField("asset_info_notes", v)} />
          <DropdownWithNotes label="Client handover" value={delivery.client_handover} onChange={(v) => setField("client_handover", v)} options={TRACK} notes={delivery.client_handover_notes} onNotesChange={(v) => setField("client_handover_notes", v)} />
          <FormField label="Lessons learned"><textarea rows={3} value={delivery.lessons_learned || ""} onChange={(e) => setField("lessons_learned", e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField>
        </FormGrid>
        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save close-out
          </Button>
        </div>
      </div>
      {children}
    </FormSection>
  );
}