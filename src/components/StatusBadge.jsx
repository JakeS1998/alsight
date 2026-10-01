import React from "react";
import agreementNames from '@/components/projects/agreementNames';
import { DOCUMENT_TYPE, EXECUTED_STATUS, PSO_CHECK, WARRANTY_STATUS, WARRANTY_CATEGORY, FORM_OF_JCT, RIBA_STAGE } from "@/lib/portal";

export function StatusBadge({ status, map }) {
  const cfg = map[status] || { label: status || "—", className: "bg-slate-100 text-slate-700 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export const DocTypeBadge = ({ type, projectNumber }) => {
  const cfg = type === 'access_agreement' ? { label: agreementNames(projectNumber).access } : DOCUMENT_TYPE[type] || { label: type || "Other" };
  return <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{cfg.label}</span>;
};

export const ExecutedBadge = ({ status }) => <StatusBadge status={status} map={EXECUTED_STATUS} />;
export const PSOCheckBadge = ({ status }) => <StatusBadge status={status} map={PSO_CHECK} />;
export const WarrantyStatusBadge = ({ status }) => <StatusBadge status={status} map={WARRANTY_STATUS} />;
export const WarrantyCategoryBadge = ({ status }) => <StatusBadge status={status} map={WARRANTY_CATEGORY} />;
export const FormOfJCTBadge = ({ status }) => <StatusBadge status={status} map={FORM_OF_JCT} />;
export const RIBAStageBadge = ({ status }) => <StatusBadge status={status} map={RIBA_STAGE} />;