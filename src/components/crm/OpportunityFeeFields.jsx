import React from 'react';
export const FEE_FIELDS = ['fee_basis', 'fee_status', 'fee_issued_date', 'fee_client_approval_date', 'fee_link_to_file', 'fee_services_included', 'fee_services_excluded', 'fee_consultants_required'];
export default function OpportunityFeeFields({ draft, set, readOnly }) {
  const textClass = 'mt-1 w-full rounded-lg border border-input bg-background p-2 font-normal';
  return <fieldset disabled={readOnly} className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Fee basis<select value={draft.fee_basis} onChange={e => set('fee_basis', e.target.value)} className={textClass}><option value="">Select basis</option><option value="fixed">Fixed</option><option value="percentage">% of works</option><option value="day_rate">Day rate</option></select></label>
    <label className="text-sm">Proposal status<select value={draft.fee_status} onChange={e => set('fee_status', e.target.value)} className={textClass}>{['draft','internal_review','sent','negotiation','accepted','lost'].map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>
    {[['fee_issued_date', 'Date issued'], ['fee_client_approval_date', 'Client approval date']].map(([key, label]) => <label key={key} className="text-sm">{label}<input type="date" value={draft[key]} onChange={e => set(key, e.target.value)} className={textClass} /></label>)}
    {[['fee_services_included', 'Services included'], ['fee_services_excluded', 'Services excluded'], ['fee_consultants_required', 'Consultants required']].map(([key, label]) => <label key={key} className="text-sm sm:col-span-2">{label}<textarea rows={2} maxLength={5000} value={draft[key]} onChange={e => set(key, e.target.value)} className={textClass} /></label>)}
    <label className="text-sm sm:col-span-2">Proposal document link<input type="url" value={draft.fee_link_to_file} onChange={e => set('fee_link_to_file', e.target.value)} className={textClass} /></label>
  </fieldset>;
}