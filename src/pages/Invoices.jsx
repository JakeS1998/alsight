import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { INVOICE_STATUS, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { Download, Receipt, Loader2 } from "lucide-react";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Invoice.list("-updated_date", 200)
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Download PDF copies of your invoices.</p>
        </div>
        {!loading && invoices.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalOutstanding)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Receipt className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No invoices available to you yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Invoice</th>
                <th className="hidden px-5 py-3 md:table-cell">Project</th>
                <th className="px-5 py-3">Amount</th>
                <th className="hidden px-5 py-3 sm:table-cell">Due</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{i.invoice_number}</td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 md:table-cell">{i.project_name || "—"}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{formatCurrency(i.amount)}</td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 sm:table-cell">{formatDate(i.due_date)}</td>
                  <td className="px-5 py-4"><StatusBadge status={i.status} map={INVOICE_STATUS} /></td>
                  <td className="px-5 py-4 text-right">
                    {i.file_url ? (
                      <a href={i.file_url} download={i.file_name || i.invoice_number} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}