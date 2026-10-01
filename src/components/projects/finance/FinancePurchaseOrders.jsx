import React, { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';
import { moneyOrNR, asNum } from './financeMoney';
import { ChevronDown, ChevronRight } from 'lucide-react';

function PoStatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold text-als-navy">{value}</p>
    </div>
  );
}

export default function FinancePurchaseOrders({ pos, lineItemsByPo, supplierMap, project, isLegacy }) {
  const [expanded, setExpanded] = useState(null);
  const active = pos.filter(p => p.status !== 'inactive');
  const totalValue = active.reduce((s, p) => s + (asNum(p.total_net_value) || 0), 0);
  const totalHas = active.some(p => p.total_net_value != null);
  const issued = active.filter(p => p.sent || p.approved).length;
  const committed = active.filter(p => p.approved || p.sent).reduce((s, p) => s + (asNum(p.total_net_value) || 0), 0);
  const remaining = totalHas ? Math.max(0, totalValue - committed) : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-heading text-base font-semibold text-als-navy">Purchase Orders</h3>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <PoStatCard label="Total PO Value" value={totalHas ? formatCurrency(totalValue) : 'Not recorded'} />
        <PoStatCard label="POs Issued" value={issued} />
        <PoStatCard label="Committed Value" value={committed > 0 ? formatCurrency(committed) : 'Not recorded'} />
        <PoStatCard label="Remaining PO Value" value={remaining != null ? formatCurrency(remaining) : 'Not recorded'} />
      </div>
      <div className="divide-y divide-slate-100">
        {pos.map(po => {
          const items = lineItemsByPo[po.dataverse_id] || [];
          const isOpen = expanded === po.dataverse_id;
          const poValue = asNum(po.total_net_value);
          const lineNet = items.reduce((s, li) => s + (asNum(li.net_value) || 0), 0);
          const displayValue = poValue != null ? poValue : items.length > 0 ? lineNet : null;
          const invoiced = items.reduce((s, li) => s + (asNum(li.invoiced_value) || 0), 0);
          const remainingVal = displayValue != null ? Math.max(0, displayValue - invoiced) : null;
          return (
            <div key={po.id}>
              <button onClick={() => setExpanded(isOpen ? null : po.dataverse_id)} className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{po.po_number}</p>
                    <p className="truncate text-xs text-slate-500">
                      {po.supplier_company_number ? (supplierMap[po.supplier_company_number] || po.supplier_company_number) : '—'}
                      {po.sent_date ? ` · issued ${formatDate(po.sent_date)}` : po.approval_date ? ` · approved ${formatDate(po.approval_date)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{moneyOrNR(displayValue)}</p>
                  <p className="text-xs text-slate-500">{items.length} line{items.length !== 1 ? 's' : ''}</p>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                  <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div><span className="text-slate-500">Original PO value: </span><span className="font-medium text-slate-800">{moneyOrNR(poValue)}</span></div>
                    <div><span className="text-slate-500">Line-item net: </span><span className="font-medium text-slate-800">{items.length > 0 ? formatCurrency(lineNet) : 'Not recorded'}</span></div>
                    <div><span className="text-slate-500">Invoiced: </span><span className="font-medium text-slate-800">{invoiced > 0 ? formatCurrency(invoiced) : 'Not recorded'}</span></div>
                    <div><span className="text-slate-500">Remaining: </span><span className="font-medium text-slate-800">{remainingVal != null ? formatCurrency(remainingVal) : 'Not recorded'}</span></div>
                  </div>
                  {items.length > 0 && (
                    <table className="mt-3 w-full text-sm">
                      <thead><tr className="text-left text-xs text-slate-400">
                        <th className="pb-2 font-medium">Description</th><th className="pb-2 font-medium">GL Code</th>
                        <th className="pb-2 text-right font-medium">Net</th><th className="pb-2 text-right font-medium">Gross</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map(li => (
                          <tr key={li.id}>
                            <td className="py-2 pr-4 text-slate-700">{li.description || li.name || '—'}</td>
                            <td className="py-2 pr-4 text-slate-500">{li.cost_center_id || '—'}</td>
                            <td className="py-2 text-right text-slate-700">{moneyOrNR(li.net_value)}</td>
                            <td className="py-2 text-right text-slate-700">{moneyOrNR(li.gross_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}