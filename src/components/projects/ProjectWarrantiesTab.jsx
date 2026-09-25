import React from "react";
import { formatDate } from "@/lib/portal";
import { WarrantyStatusBadge, WarrantyCategoryBadge } from "@/components/StatusBadge";
import { ShieldCheck, ExternalLink } from "lucide-react";

export function ProjectWarrantiesTab({ project, warranties, accountMap }) {
  if (warranties.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">No warranties for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Services</th>
            <th className="hidden px-4 py-3 md:table-cell">Account</th>
            <th className="hidden px-4 py-3 sm:table-cell">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="hidden px-4 py-3 lg:table-cell">JCT Signed</th>
            <th className="hidden px-4 py-3 lg:table-cell">Warranty Due</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {warranties.map((w) => (
            <tr key={w.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{accountMap[w.supplier_id]?.name || accountMap[w.account_id]?.name || "Supplier unavailable"}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{w.services || "—"}</td>
              <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                {accountMap[w.account_id]?.name || accountMap[w.supplier_id]?.name || "—"}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <WarrantyCategoryBadge status={w.category} />
              </td>
              <td className="px-4 py-3"><WarrantyStatusBadge status={w.warranty_status} /></td>
              <td className="hidden px-4 py-3 text-sm text-slate-600 lg:table-cell">{formatDate(w.jct_signed)}</td>
              <td className="hidden px-4 py-3 text-sm text-slate-600 lg:table-cell">{formatDate(w.warranty_due)}</td>
              <td className="px-4 py-3 text-right">
                {w.link_to_file ? (
                  <a href={w.link_to_file} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}