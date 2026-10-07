import React from 'react';
import { CheckCircle2, XCircle, FileText, PoundSterling, PenLine } from 'lucide-react';
import { formatCurrency } from '@/lib/portal';

export default function DesignTeamCard({ label, appointed, account, fee, signed, po, link, untracked, notApplicable }) {
  if (notApplicable) return <div className="h-full rounded-xl border border-border bg-muted p-3"><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-2 text-xs font-medium text-muted-foreground">Not applicable</p><p className="mt-1 text-xs text-muted-foreground">Excluded from appointment progress by legal decision.</p></div>;
  const hasFee = fee != null;
  return <div className={`h-full rounded-xl border p-3 ${appointed ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50'}`}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {untracked ? <span className="text-xs text-slate-400">Not tracked</span> : appointed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-300" />}
    </div>
    {account && <div className="mt-2 text-xs font-medium text-slate-700">{account}</div>}
    {(appointed || hasFee) && <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
      <span className={hasFee ? 'text-emerald-700' : 'text-slate-400'}><PoundSterling className="mr-0.5 inline h-3 w-3" />{hasFee ? formatCurrency(fee) : 'Fee —'}</span>
      {appointed && <span className={signed ? 'text-emerald-700' : 'text-slate-400'}><PenLine className="mr-0.5 inline h-3 w-3" />{signed ? 'Signed' : 'Unsigned'}</span>}
      {po && <span className="text-amber-700">PO issued</span>}
    </div>}
    {!appointed && <p className="mt-1 text-xs text-slate-400">{untracked ? 'Add an appointment document to track this role.' : 'No appointment yet.'}</p>}
    {link && <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"><FileText className="h-3 w-3" /> Open document</a>}
  </div>;
}