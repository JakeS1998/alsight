import React from "react";
import { WarrantyCard } from "@/components/documents/WarrantyCard";
import { ShieldCheck } from "lucide-react";

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
    <div className="space-y-2">
      {warranties.map((w) => <WarrantyCard key={w.id} warranty={w} accountMap={accountMap} />)}
    </div>
  );
}