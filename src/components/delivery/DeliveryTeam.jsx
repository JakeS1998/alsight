import React, { useEffect, useState } from "react";
import { FormSection, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Button } from "@/components/ui/button";
import SearchableSelect from '@/components/forms/SearchableSelect';
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Loader2, Upload, FileCheck } from "lucide-react";
import ContractorFeeBuilder from '@/components/delivery/ContractorFeeBuilder';
import ContractorStageOhp from '@/components/delivery/ContractorStageOhp';

const ROLES = ["Contractor", "Project Manager", "Principal Designer (CDM)", "Principal Designer (BR)", "Architect", "Structural Engineer", "M&E Engineer", "Cost Consultant", "Other"];
const STAGES = ["riba_1", "riba_2", "riba_3", "riba_4", "riba_5_7"];
const STAGE_LABELS = { riba_1: "RIBA 1", riba_2: "RIBA 2", riba_3: "RIBA 3", riba_4: "RIBA 4", riba_5_7: "RIBA 5-7" };
const EMPTY_MEMBER = { role: "", supplier_company_number: "", fee_proposal_link: "", fees: { riba_1: "", riba_2: "", riba_3: "", riba_4: "", riba_5_7: "" } };

const isContractor = (m) => String(m?.role || "").trim().toLowerCase() === "contractor";

// Migrate legacy per-stage fees object into the contractor_fees array used by the builder.
const migrateContractor = (m) => {
  if (!isContractor(m) || Array.isArray(m.contractor_fees)) return m;
  const legacy = m.fees || {};
  const arr = [];
  STAGES.forEach((st) => {
    const val = legacy[st];
    if (val !== "" && val !== null && val !== undefined && Number(val) > 0) {
      arr.push({ id: `${st}-${Math.random().toString(36).slice(2)}`, type: st === "riba_5_7" ? "authorised_activity" : "survey", stage: st, amount: Number(val) });
    }
  });
  return { ...m, contractor_fees: arr };
};

export function DeliveryTeam({ project, delivery, setField, onSave, saving, suppliers }) {
  const [team, setTeam] = useState([]);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(delivery.delivery_team || "[]");
      setTeam((Array.isArray(parsed) ? parsed : []).map((m) => (isContractor(m) ? migrateContractor(m) : m)));
    } catch { setTeam([]); }
  }, [delivery.delivery_team]);

  const commit = (next) => { setTeam(next); setField("delivery_team", JSON.stringify(next)); };
  const addMember = () => commit([...team, { ...EMPTY_MEMBER, fees: { ...EMPTY_MEMBER.fees } }]);
  const removeMember = (idx) => commit(team.filter((_, i) => i !== idx));
  const setMember = (idx, field, value) => {
    const next = team.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [field]: value };
      if (field === "role" && isContractor(updated) && !Array.isArray(updated.contractor_fees)) {
        updated.contractor_fees = migrateContractor(updated).contractor_fees;
      }
      return updated;
    });
    commit(next);
  };
  const setFee = (idx, stage, value) => commit(team.map((m, i) => (i === idx ? { ...m, fees: { ...m.fees, [stage]: value } } : m)));
  const setContractorFees = (idx, fees) => commit(team.map((m, i) => (i === idx ? { ...m, contractor_fees: fees } : m)));

  const uploadFile = async (idx, file) => {
    if (!file) return;
    setUploading(idx);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setMember(idx, "fee_proposal_link", file_url);
    } finally { setUploading(null); }
  };

  return (
    <FormSection title="1b · Delivery Team" description="Add each supplier, upload their fee proposal and enter their fees per RIBA stage — these feed the Fee Proposal">
      <div className="space-y-3">
        {team.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-500">No team members yet. Add the contractor, PM, PD and other suppliers.</div>
        )}
        {team.map((m, idx) => (
          <div key={idx} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <FormField label="Role">
                  <SearchableSelect value={m.role} onChange={(e) => setMember(idx, "role", e.target.value)} className={formInputClass}>
                    <option value="">—</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </SearchableSelect>
                </FormField>
                <FormField label="Supplier (optional)">
                  <SearchableSelect value={m.supplier_company_number} onChange={(e) => setMember(idx, "supplier_company_number", e.target.value)} className={formInputClass}>
                    <option value="">—</option>
                    {suppliers.map((s) => <option key={s.id} value={s.company_number}>{s.name}</option>)}
                  </SearchableSelect>
                </FormField>
                <FormField label="Fee proposal received">
                  {m.fee_proposal_link ? (
                    <div className="flex h-10 items-center gap-3">
                      <a href={m.fee_proposal_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><FileCheck className="h-4 w-4" /> View</a>
                      <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
                        <Upload className="h-3.5 w-3.5" /> Replace
                        <input type="file" className="hidden" onChange={(e) => uploadFile(idx, e.target.files?.[0])} disabled={uploading === idx} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-500 hover:bg-slate-50">
                      {uploading === idx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading === idx ? "Uploading..." : "Upload"}
                      <input type="file" className="hidden" onChange={(e) => uploadFile(idx, e.target.files?.[0])} disabled={uploading === idx} />
                    </label>
                  )}
                </FormField>
              </div>
              <button onClick={() => removeMember(idx)} className="mt-1 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
            </div>
            {isContractor(m) ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Contractor fee build-up (£)</p>
                <ContractorFeeBuilder projectId={project.id} fees={m.contractor_fees} onChange={(fees) => setContractorFees(idx, fees)} />
                <div className="mt-3"><ContractorStageOhp member={m} onChange={value => setMember(idx, 'contractor_ohp', value)} /></div>
              </div>
            ) : (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Fees per RIBA stage (£)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {STAGES.map((st) => (
                    <div key={st}>
                      <label className="mb-0.5 block text-[11px] text-slate-500">{STAGE_LABELS[st]}</label>
                      <input type="number" value={m.fees?.[st] ?? ""} onChange={(e) => setFee(idx, st, e.target.value)} placeholder="0" className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={addMember}><Plus className="mr-1.5 h-4 w-4" /> Add team member</Button>
          <Button type="button" onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save team
          </Button>
        </div>
      </div>
    </FormSection>
  );
}