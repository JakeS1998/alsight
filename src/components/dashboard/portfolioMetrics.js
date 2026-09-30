import { findProjectForPO } from '@/components/projects/poLinking';

export const isPipelineProject = (p) => p.status !== "inactive" && !["complete", "completed"].includes(String(p.approval_status || "").trim().toLowerCase()) && !(p.practical_completion_date && new Date(p.practical_completion_date) < new Date());
const sum = (list, field) => list.reduce((total, row) => total + (Number(row[field]) || 0), 0);

export function buildPortfolio(projects, { orders = [], proposals = [], deliveries = [], actions = [] }) {
  const pipeline = projects.filter(isPipelineProject);
  const ids = new Set(pipeline.map((p) => p.id));
  const relevantOrders = orders.filter(o => o.status !== 'inactive').map(o => {
    const project = findProjectForPO(o, pipeline);
    return project ? { ...o, linked_project_id: project.id } : null;
  }).filter(Boolean);
  const relevantActions = actions.filter((a) => ids.has(a.project_id) && a.status !== "done");
  const currentFees = new Map();
  proposals.filter((f) => ids.has(f.project_id)).forEach((f) => {
    const old = currentFees.get(f.project_id);
    if (!old || (f.is_current && !old.is_current) || (f.is_current === old.is_current && (Number(f.revision_number) || 0) > (Number(old.revision_number) || 0))) currentFees.set(f.project_id, f);
  });
  const latestDelivery = new Map();
  deliveries.filter((d) => ids.has(d.project_id)).forEach((d) => {
    const previous = latestDelivery.get(d.project_id);
    if (!previous || String(d.updated_date || d.created_date || "") > String(previous.updated_date || previous.created_date || "")) latestDelivery.set(d.project_id, d);
  });
  const byProject = new Map();
  pipeline.forEach((p) => byProject.set(p.id, { project: p, reasons: [], level: "" }));
  const flag = (id, reason, level) => {
    const row = byProject.get(id);
    if (!row) return;
    if (!row.reasons.includes(reason)) row.reasons.push(reason);
    if (level === "high" || !row.level) row.level = level;
  };
  const today = new Date().toISOString().slice(0, 10);
  relevantActions.forEach((a) => { if (a.due_date && a.due_date.slice(0, 10) < today) flag(a.project_id, `Overdue action: ${a.action || "Action"}`, a.priority === "high" ? "high" : "watch"); });
  [...latestDelivery.values()].forEach((d) => {
    if (!d.pc_achieved && d.forecast_pc && d.forecast_pc.slice(0, 10) < today) flag(d.project_id, "Forecast completion overdue", "high");
    if (!d.pc_achieved && d.original_pc && d.forecast_pc && d.forecast_pc.slice(0, 10) > d.original_pc.slice(0, 10)) flag(d.project_id, "Forecast completion later than original", "watch");
  });
  const atRisk = [...byProject.values()].filter((r) => r.reasons.length).sort((a, b) => (a.level === "high" ? 0 : 1) - (b.level === "high" ? 0 : 1) || a.project.name.localeCompare(b.project.name));
  return {
    pipeline, atRisk, orders: relevantOrders, fees: [...currentFees.values()],
    metrics: {
      projects: pipeline.length, live: pipeline.filter((p) => p.live_project).length,
      value: sum(pipeline, "estimated_value"), poNet: sum(relevantOrders, "total_net_value"),
      feeValue: sum([...currentFees.values()], "fee_value"),
      contractValue: sum([...latestDelivery.values()], "contract_sum"),
      highRisk: atRisk.filter((r) => r.level === "high").length, atRisk: atRisk.length,
    },
  };
}