import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const ROLES = ['Project Manager', 'Principal Designer (CDM)', 'Principal Designer (BR)', 'Architect', 'Structural Engineer', 'M&E Engineer', 'Cost Consultant', 'Contractor', 'Other'];
const STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4', 'riba_5_7'];
export default function OpportunityTeam({ item, onSave, canEdit, saving }) {
  const [team, setTeam] = useState(item.design_team || []);
  const update = (index, patch) => setTeam(team.map((member, i) => i === index ? { ...member, ...patch } : member));
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div><h2 className="font-semibold">Design &amp; consultant team</h2><p className="text-sm text-muted-foreground">Plan roles, firms and indicative fees by RIBA stage.</p></div>
    {!team.length && <p className="text-sm text-muted-foreground">No team members added yet.</p>}
    {team.map((member, index) => <div key={index} className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Role<select disabled={!canEdit || item.status !== 'open'} value={member.role || ''} onChange={e => update(index, { role: e.target.value })} className="mt-1 w-full rounded-lg border border-input p-2"><option value="">Select role</option>{ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></label>
      <label className="text-sm">Firm / proposed member<input disabled={!canEdit || item.status !== 'open'} maxLength={200} value={member.supplier_name || ''} onChange={e => update(index, { supplier_name: e.target.value })} className="mt-1 w-full rounded-lg border border-input p-2" /></label>
      <label className="text-sm">Company number (if supplier)<input disabled={!canEdit || item.status !== 'open'} maxLength={20} value={member.supplier_company_number || ''} onChange={e => update(index, { supplier_company_number: e.target.value })} className="mt-1 w-full rounded-lg border border-input p-2" /></label></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{STAGES.map((stage, i) => <label key={stage} className="text-xs">RIBA {i === 4 ? '5–7' : i + 1} fee (£)<input disabled={!canEdit || item.status !== 'open'} type="number" min="0" step="0.01" value={member.fees?.[stage] ?? ''} onChange={e => update(index, { fees: { ...member.fees, [stage]: e.target.value } })} className="mt-1 w-full rounded-lg border border-input p-2 text-sm" /></label>)}</div>
      {canEdit && item.status === 'open' && <button type="button" className="text-xs text-destructive hover:underline" onClick={() => setTeam(team.filter((_, i) => i !== index))}>Remove member</button>}
    </div>)}
    {canEdit && item.status === 'open' && <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setTeam([...team, { role: '', supplier_name: '', supplier_company_number: '', fees: {} }])}>Add team member</Button><Button type="button" disabled={saving || team.some(m => !m.role)} onClick={() => onSave({ design_team: team })}>{saving ? 'Saving…' : 'Save team'}</Button></div>}
  </section>;
}