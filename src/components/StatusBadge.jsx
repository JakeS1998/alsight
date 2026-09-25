import React from "react";
import { PROJECT_STATUS, CONTRACT_STATUS, INVOICE_STATUS } from "@/lib/portal";

export function StatusBadge({ status, map }) {
  const cfg = map[status] || { label: status, className: "bg-slate-100 text-slate-700 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export const ProjectStatusBadge = ({ status }) => <StatusBadge status={status} map={PROJECT_STATUS} />;
export const ContractStatusBadge = ({ status }) => <StatusBadge status={status} map={CONTRACT_STATUS} />;
export const InvoiceStatusBadge = ({ status }) => <StatusBadge status={status} map={INVOICE_STATUS} />;