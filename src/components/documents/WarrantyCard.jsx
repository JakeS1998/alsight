import React, { useState } from "react";
import { warrantyName } from "@/components/documents/documentNames";
import { WarrantyStatusBadge, WarrantyCategoryBadge } from "@/components/StatusBadge";
import { ProgressTracker, getWarrantySteps } from "@/components/documents/ProgressTracker";
import { WarrantyDetails } from "@/components/documents/WarrantyDetails";
import { ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";

export function WarrantyCard({ warranty, accountMap, hideCommentsAndLinks = false }) {
  const [open, setOpen] = useState(false);
  const supplierName = accountMap[warranty.supplier_id]?.name || accountMap[warranty.account_id]?.name;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50">
          <div className="flex min-w-0 items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{warrantyName(supplierName, warranty.services)}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-slate-500">{warranty.warranty_id}</span>
                <WarrantyCategoryBadge status={warranty.category} />
              </div>
            </div>
          </div>
          <WarrantyStatusBadge status={warranty.warranty_status} />
        </div>
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4">
          <ProgressTracker steps={getWarrantySteps(warranty)} />
          <WarrantyDetails warranty={warranty} accountMap={accountMap} hideCommentsAndLinks={hideCommentsAndLinks} />
        </div>
      )}
    </div>
  );
}