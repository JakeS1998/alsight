import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/portal";
import { Receipt, ChevronDown, ChevronRight, Building2, Layers, PoundSterling } from "lucide-react";

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function ProjectFinanceTab({ project }) {
  const [pos, setPos] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ref = project.project_number;
        const [poData, liData, glData, custData, accData] = await Promise.all([
          ref ? base44.entities.PurchaseOrder.filter({ project_ref: ref }, "-created_date", 1000).catch(() => []) : [],
          base44.entities.PurchaseOrderLineItem.list("-created_date", 5000).catch(() => []),
          base44.entities.GLCode.list("-name", 500).catch(() => []),
          base44.entities.Customer.list("-name", 500).catch(() => []),
          base44.entities.Account.list("-name", 1000).catch(() => []),
        ]);
        setPos(poData);
        setLineItems(liData);
        setGlCodes(glData);
        setCustomers(custData);
        setAccounts(accData);
      } finally {
        setLoading(false);
      }
    })();
  }, [project.id]);

  const glMap = useMemo(() => {
    const m = {};
    glCodes.forEach((g) => { if (g.dataverse_id) m[g.dataverse_id] = g; });
    return m;
  }, [glCodes]);

  const supplierMap = useMemo(() => {
    const m = {};
    accounts.forEach((a) => { if (a.company_number) m[a.company_number] = a.name; });
    customers.forEach((c) => { if (c.company_number) m[c.company_number] = c.name; });
    return m;
  }, [accounts, customers]);

  const poIds = useMemo(() => new Set(pos.map((p) => p.dataverse_id)), [pos]);
  const projectLineItems = useMemo(() => lineItems.filter((li) => poIds.has(li.po_id)), [lineItems, poIds]);

  const totals = useMemo(() => {
    const liNet = projectLineItems.reduce((s, li) => s + (li.net_value || 0), 0);
    const liGross = projectLineItems.reduce((s, li) => s + (li.gross_value || 0), 0);
    const poNet = pos.reduce((s, p) => s + (p.total_net_value || 0), 0);
    return {
      poCount: pos.length,
      liCount: projectLineItems.length,
      liNet,
      liGross,
      poNet,
      supplierCount: new Set(pos.map((p) => p.supplier_company_number).filter(Boolean)).size,
    };
  }, [pos, projectLineItems]);

  const byCostCenter = useMemo(() => {
    const m = {};
    projectLineItems.forEach((li) => {
      const key = li.cost_center_id || "_none";
      if (!m[key]) m[key] = { gl: glMap[key], net: 0, gross: 0, count: 0 };
      m[key].net += li.net_value || 0;
      m[key].gross += li.gross_value || 0;
      m[key].count += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].net - a[1].net);
  }, [projectLineItems, glMap]);

  const lineItemsByPo = useMemo(() => {
    const m = {};
    projectLineItems.forEach((li) => { (m[li.po_id] = m[li.po_id] || []).push(li); });
    return m;
  }, [projectLineItems]);

  if (loading) return <Spinner />;

  if (!project.project_number) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <Receipt className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">This project has no PROJ reference, so finance records can't be linked.</p>
      </div>
    );
  }

  if (pos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <Receipt className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">No purchase orders linked to {project.project_number}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Receipt} label="Purchase Orders" value={totals.poCount} sub={`${totals.liCount} line items`} />
        <StatCard icon={PoundSterling} label="Line Net Value" value={formatCurrency(totals.liNet)} sub={`Gross ${formatCurrency(totals.liGross)}`} />
        <StatCard icon={Layers} label="PO Total Net" value={formatCurrency(totals.poNet)} sub="from PO headers" />
        <StatCard icon={Building2} label="Suppliers" value={totals.supplierCount} />
      </div>

      {byCostCenter.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-heading text-base font-semibold text-slate-900">Spend by GL Code</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {byCostCenter.map(([key, v]) => (
              <div key={key} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{v.gl ? `${v.gl.cost_center} — ${v.gl.name}` : "Uncategorised"}</p>
                  <p className="text-xs text-slate-500">{v.gl?.nominal_code ? `Nominal ${v.gl.nominal_code}` : ""} · {v.count} item{v.count !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(v.net)}</p>
                  <p className="text-xs text-slate-500">gross {formatCurrency(v.gross)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-heading text-base font-semibold text-slate-900">Purchase Orders</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {pos.map((po) => {
            const items = lineItemsByPo[po.dataverse_id] || [];
            const isOpen = expanded === po.dataverse_id;
            const poNet = items.reduce((s, li) => s + (li.net_value || 0), 0);
            return (
              <div key={po.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : po.dataverse_id)}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{po.po_number}</p>
                      <p className="truncate text-xs text-slate-500">
                        {po.supplier_company_number ? (supplierMap[po.supplier_company_number] || po.supplier_company_number) : "—"}
                        {po.sent_date ? ` · sent ${formatDate(po.sent_date)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(po.total_net_value || poNet)}</p>
                    <p className="text-xs text-slate-500">{items.length} line{items.length !== 1 ? "s" : ""}</p>
                  </div>
                </button>
                {isOpen && items.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400">
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium">GL Code</th>
                          <th className="pb-2 text-right font-medium">Net</th>
                          <th className="pb-2 text-right font-medium">Gross</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((li) => (
                          <tr key={li.id}>
                            <td className="py-2 pr-4 text-slate-700">{li.description || li.name}</td>
                            <td className="py-2 pr-4 text-slate-500">{li.cost_center_id && glMap[li.cost_center_id] ? `${glMap[li.cost_center_id].cost_center} — ${glMap[li.cost_center_id].name}` : "—"}</td>
                            <td className="py-2 text-right text-slate-700">{formatCurrency(li.net_value)}</td>
                            <td className="py-2 text-right text-slate-700">{formatCurrency(li.gross_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {isOpen && items.length === 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-400">No line items recorded for this PO.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProjectFinanceTab;