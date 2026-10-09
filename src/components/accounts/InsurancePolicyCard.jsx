import React from 'react';
import {ExternalLink} from 'lucide-react';
import {formatCurrency} from '@/lib/portal';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import {insuranceTiming,insuranceDate} from '@/components/accounts/insuranceDates';
export default function InsurancePolicyCard({policy}) {
 const timing=insuranceTiming(policy),certificate=/^https:\/\//i.test(policy.certificate_url || '');
 const fields=[['Policy type',policy.policy_type],['Policy number',policy.policy_number],['Insurer',policy.insurer],['Cover amount',policy.cover_amount==null ? null : formatCurrency(policy.cover_amount)],['Excess',policy.excess==null ? null : formatCurrency(policy.excess)],['Start date',insuranceDate(policy.start_date)],['Expiry date',insuranceDate(policy.expiry_date)],['Renewal date',insuranceDate(policy.renewal_date)]];
 return <details className="rounded-panel border border-border bg-card"><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4"><div><h3 className="font-semibold">{policy.name}</h3><p className="text-sm text-muted-foreground">{[policy.policy_type,policy.policy_number,policy.insurer].filter(Boolean).join(' · ') || 'Policy details not recorded'}</p><p className="mt-1 text-xs text-muted-foreground">Expiry: {insuranceDate(policy.expiry_date)}{policy.status==='inactive' ? ' · Inactive record' : ''}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${timing.tone}`}>{timing.label}</span></summary>
  <div className="space-y-4 border-t border-border p-4"><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{fields.map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value || 'Not recorded'}</dd></div>)}</dl><div><h4 className="text-xs text-muted-foreground">Comments</h4><p className="mt-1 whitespace-pre-wrap text-sm">{policy.comments || 'No comments recorded.'}</p></div>
   {certificate ? <a href={policy.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold underline"><ExternalLink className="h-4 w-4"/>Open insurance certificate</a> : <p className="text-sm text-muted-foreground">{policy.certificate_url ? 'Certificate link is not a secure web address.' : 'No certificate linked.'}</p>}
   <RecordUpdatedAt record={policy}/><p className="text-xs text-muted-foreground">Synced from Dataverse. Update policy information in the source system.</p>
  </div>
 </details>;
}