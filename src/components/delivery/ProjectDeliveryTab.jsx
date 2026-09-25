import React, { useEffect, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { DeliveryScoping } from "./DeliveryScoping";
import { FeeProposalSection } from "./FeeProposalSection";
import { PreConstructionReadiness } from "./PreConstructionReadiness";
import { DesignTeam } from "./DesignTeam";
import { ProgrammeMilestones } from "./ProgrammeMilestones";
import { RegisterList } from "./RegisterList";
import { DeliveryConstruction } from "./DeliveryConstruction";
import { DeliveryCloseout } from "./DeliveryCloseout";
import { DeliveryTeam } from "./DeliveryTeam";

const DELIVERY_DEFAULT = {
  funding_route: "", scope_summary: "", client_objectives: "", initial_constraints: "",
  target_programme: "", key_stakeholders: "", site_visit_completed: false,
  feasibility_status: "", probability: "", next_action: "",
  contract_sum: "", contractor: "", contract_start: "", original_pc: "", forecast_pc: "",
  pct_programme: "", pct_cost: "", current_valuation: "", variations: "", eot: "",
  lad_exposure: "", key_site_issues: "", last_progress_meeting: "", next_progress_meeting: "",
  pc_achieved: "", pc_certificate: "", final_account_status: "", defects_period: "",
  retention: "", om_manuals: "", hs_file: "", warranties_status: "", training: "",
  asset_info: "", client_handover: "", lessons_learned: "",
  delivery_team: "",
};

const ACTION_COLS = [
  { key: "action", label: "Action", required: true, fullWidth: true, type: "text" },
  { key: "owner", label: "Owner", type: "text" },
  { key: "due_date", label: "Due", type: "date" },
  { key: "priority", label: "Priority", type: "select", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
  { key: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }, { value: "in_progress", label: "In progress" }, { value: "done", label: "Done" }] },
  { key: "comments", label: "Comments", type: "textarea", fullWidth: true },
];
const ACTION_TABLE = ["action", "owner", "due_date", "priority", "status"];

const DECISION_COLS = [
  { key: "decision_title", label: "Decision", required: true, fullWidth: true, type: "text" },
  { key: "requested_by", label: "Requested by", type: "text" },
  { key: "date_requested", label: "Date requested", type: "date" },
  { key: "required_by", label: "Required by", type: "date" },
  { key: "decision_maker", label: "Decision maker", type: "text" },
  { key: "decision", label: "Decision", type: "textarea", fullWidth: true },
  { key: "date_agreed", label: "Date agreed", type: "date" },
  { key: "financial_impact", label: "Financial impact", type: "text" },
  { key: "programme_impact", label: "Programme impact", type: "text" },
  { key: "supporting_document", label: "Supporting document (link)", type: "text", fullWidth: true },
  { key: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }, { value: "agreed", label: "Agreed" }] },
];
const DECISION_TABLE = ["decision_title", "requested_by", "required_by", "date_agreed", "status"];

const RISK_COLS = [
  { key: "title", label: "Risk / Issue", required: true, fullWidth: true, type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "probability", label: "Probability", type: "select", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
  { key: "impact", label: "Impact", type: "select", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
  { key: "owner", label: "Owner", type: "text" },
  { key: "mitigation", label: "Mitigation", type: "textarea", fullWidth: true },
  { key: "target_resolution", label: "Target resolution", type: "date" },
  { key: "rag", label: "RAG", type: "select", options: [{ value: "red", label: "Red" }, { value: "amber", label: "Amber" }, { value: "green", label: "Green" }] },
  { key: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }] },
];
const RISK_TABLE = ["title", "category", "owner", "target_resolution", "rag", "status"];

export function ProjectDeliveryTab({ project, legalDocs, dmas, jcts, warranties, accountMap }) {
  const projectId = project.id;
  const [delivery, setDelivery] = useState(DELIVERY_DEFAULT);
  const [deliveryId, setDeliveryId] = useState(null);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [feeProposals, setFeeProposals] = useState([]);
  const [bdmName, setBdmName] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const loadSuppliers = useCallback(async () => {
    const sup = await base44.entities.Account.filter({ account_type: "supplier" }, "name", 500).catch(() => []);
    setSuppliers(sup);
  }, []);

  const loadDelivery = useCallback(async () => {
    const existing = await base44.entities.ProjectDelivery.filter({ project_id: projectId }, "-created_date", 10).catch(() => []);
    if (existing.length) {
      setDeliveryId(existing[0].id);
      setDelivery({ ...DELIVERY_DEFAULT, ...existing[0] });
    } else {
      setDeliveryId(null);
      setDelivery(DELIVERY_DEFAULT);
    }
  }, [projectId]);

  const loadBdmName = useCallback(async () => {
    if (!project.bdm_aad_id) return;
    const c = await base44.entities.Contact.filter({ aad_id: project.bdm_aad_id }, "full_name", 5).catch(() => []);
    setBdmName(c[0]?.full_name || null);
  }, [project.bdm_aad_id]);

  useEffect(() => { loadDelivery(); loadBdmName(); loadSuppliers(); }, [loadDelivery, loadBdmName, loadSuppliers]);

  const setField = (key, value) => setDelivery((prev) => ({ ...prev, [key]: value }));

  const deliveryTeam = useMemo(() => {
    try { return JSON.parse(delivery.delivery_team || "[]") || []; } catch { return []; }
  }, [delivery.delivery_team]);

  const saveDelivery = async () => {
    setSavingDelivery(true);
    try {
      const payload = { ...delivery, project_id: projectId, client_account_id: project.client_account_id || null, bdm_aad_id: project.bdm_aad_id || null };
      // coerce numeric fields
      ["probability", "contract_sum", "pct_programme", "pct_cost", "current_valuation"].forEach((k) => {
        payload[k] = payload[k] === "" ? null : Number(payload[k]);
      });
      payload.site_visit_completed = !!payload.site_visit_completed;
      if (deliveryId) {
        await base44.entities.ProjectDelivery.update(deliveryId, payload);
      } else {
        const created = await base44.entities.ProjectDelivery.create(payload);
        if (created?.id) setDeliveryId(created.id);
      }
    } finally {
      setSavingDelivery(false);
    }
  };

  return (
    <div className="space-y-6">
      <DeliveryScoping project={project} accountMap={accountMap} bdmName={bdmName} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
      <DeliveryTeam project={project} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} suppliers={suppliers} />
      <FeeProposalSection projectId={projectId} project={project} onChanged={setFeeProposals} deliveryTeam={deliveryTeam} suppliers={suppliers} />
      <PreConstructionReadiness project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} feeProposals={feeProposals} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
      <DesignTeam legalDocs={legalDocs} jcts={jcts} warranties={warranties} accountMap={accountMap} />
      <ProgrammeMilestones project={project} feeProposals={feeProposals} jcts={jcts} />
      <RegisterList title="Action" description="The simple action log BDMs use every day" entityName="ProjectAction" projectId={projectId} project={project} columns={ACTION_COLS} tableColumns={ACTION_TABLE} sortBy="-due_date" addLabel="Add action" />
      <RegisterList title="Decision" description="Lightweight decision & client-approval register" entityName="ProjectDecision" projectId={projectId} project={project} columns={DECISION_COLS} tableColumns={DECISION_TABLE} sortBy="-date_requested" addLabel="Add decision" />
      <RegisterList title="Risk" description="Risks & issues register" entityName="ProjectRisk" projectId={projectId} project={project} columns={RISK_COLS} tableColumns={RISK_TABLE} sortBy="-created_date" addLabel="Add risk" />
      <DeliveryConstruction delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
      <DeliveryCloseout delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
    </div>
  );
}