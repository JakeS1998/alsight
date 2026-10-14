import React from 'react';
import { FormField, formInputClass } from '@/components/forms/PowerForm';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/forms/SearchableSelect';
import { CheckCircle2, AlertTriangle, Loader2, LockKeyhole } from 'lucide-react';
import agreementNames from '@/components/projects/agreementNames';
import SharePointSourceControls from '@/components/delivery/SharePointSourceControls';

export default function PSOSignoffGateways({ project, delivery, setField, onSave, saving, onImported }) {
 const names = agreementNames(project.project_number);
 const gateways = [{ key:'pq', label:'Project Questionnaire (PQ)' },{ key:'aa', label:`${names.access} (${names.accessShort})` },{ key:'aa_variations', label:`${names.accessShort} Variations` },{ key:'dma', label:names.developmentShort }];
 const locked = delivery.pso_workbook_fields || [];
 const source = /^https:\/\//i.test(project.link_to_pso || '') ? project.link_to_pso : null;
 return <div className="rounded-xl border border-border bg-card p-4">
  <div className="mb-3 flex items-center justify-between gap-3">
   <div><h4 className="text-sm font-semibold">PSO Sign-off Gateways</h4><p className="text-xs text-muted-foreground">Internal executive approval to enter into agreements; separate from later external approvals.</p>
    {locked.length > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><LockKeyhole className="h-3 w-3" />Workbook-populated fields are locked.{source && <a href={source} target="_blank" rel="noopener noreferrer" className="ml-1 underline">Open PSO workbook</a>}</p>}
   </div>
   <Button type="button" size="sm" onClick={onSave} disabled={saving || locked.length === 8}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save PSO</Button>
  </div>
  <SharePointSourceControls key={project.id} project={project} onImported={onImported} />
  <div className="grid gap-3 sm:grid-cols-2">{gateways.map(g => {
   const approverField = `pso_${g.key}_approved_by`, dateField = `pso_${g.key}_date`;
   const approverLocked = locked.includes(approverField), dateLocked = locked.includes(dateField), received = !!delivery[dateField];
   return <div key={g.key} className="rounded-lg border border-border p-3">
    <div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-semibold">{g.label}</p>
     <span className={received ? 'inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success' : 'inline-flex items-center gap-1 rounded-full border border-risk-elevated/20 bg-risk-elevated/10 px-2 py-0.5 text-[10px] font-medium text-risk-elevated'}>{received ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{received ? 'PSO received' : 'PSO outstanding'}</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
     <FormField label="Approved by"><SearchableSelect value={delivery[approverField] || ''} disabled={approverLocked} title={approverLocked ? 'Imported from PSO workbook; read-only' : undefined} onChange={e => setField(approverField, e.target.value)} className={`${formInputClass} disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground`}><option value="">Select approver</option><option value="Sarah Watts">Sarah Watts</option><option value="Paul Cluett">Paul Cluett</option>{delivery[approverField] && !['Sarah Watts','Paul Cluett'].includes(delivery[approverField]) && <option value={delivery[approverField]}>{delivery[approverField]}</option>}</SearchableSelect></FormField>
     <FormField label="Date"><input type="date" value={delivery[dateField] ? String(delivery[dateField]).slice(0,10) : ''} disabled={dateLocked} title={dateLocked ? 'Imported from PSO workbook; read-only' : undefined} onChange={e => setField(dateField, e.target.value)} className={`${formInputClass} disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground`} /></FormField>
    </div>
   </div>;
  })}</div>
 </div>;
}