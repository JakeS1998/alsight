import React, { useEffect, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { DeliveryScoping } from "./DeliveryScoping";
import { FeeProposalSection } from "./FeeProposalSection";
import { PreConstructionReadiness } from "./PreConstructionReadiness";
import { DesignTeam } from "./DesignTeam";
import { ProgrammeMilestones } from "./ProgrammeMilestones";
import { RegisterList } from "./RegisterList";
import { DeliveryConstruction } from "./DeliveryConstruction";
import { DeliveryCloseout } from "./DeliveryCloseout";
import { DeliveryTeam } from "./DeliveryTeam";
import ProjectRiskRegister from '@/components/delivery/ProjectRiskRegister';
import ProjectHandoverPack from '@/components/handover/ProjectHandoverPack';
import DeliveryJourney from '@/components/delivery/DeliveryJourney';
import { FormSection } from '@/components/forms/PowerForm';
import frameworkAgreementRoute from '@/components/delivery/frameworkAgreementRoute';
import SingleTaskDelivery from '@/components/delivery/SingleTaskDelivery';
import usePDbrApplicability from '@/components/delivery/usePDbrApplicability';
import { savedConstructionValues } from '@/components/delivery/constructionAutomation';

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

import { ACTION_COLS, ACTION_TABLE, DECISION_COLS, DECISION_TABLE } from '@/components/delivery/projectRegisterColumns';



export function ProjectDeliveryTab({ project, legalDocs, dmas, jcts, warranties, accountMap }) {
  const projectId = project.id;
  const pdBrReview = usePDbrApplicability(project);
  const [delivery, setDelivery] = useState(DELIVERY_DEFAULT);
  const [deliveryId, setDeliveryId] = useState(null);
  const [savedDelivery, setSavedDelivery] = useState(null);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [feeProposals, setFeeProposals] = useState([]);
  const [bdmName, setBdmName] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const loadSuppliers = useCallback(async () => {
    const sup = await filterAll(base44.entities.Account, { account_type: "supplier" }, "name").catch(() => []);
    setSuppliers(sup);
  }, []);

  const loadDelivery = useCallback(async () => {
    const existing = await base44.entities.ProjectDelivery.filter({ project_id: projectId }, "-created_date", 10).catch(() => []);
    if (existing.length) {
      setDeliveryId(existing[0].id);
      setDelivery({ ...DELIVERY_DEFAULT, ...existing[0] });
      setSavedDelivery(existing[0]);
    } else {
      setDeliveryId(null);
      setDelivery(DELIVERY_DEFAULT);
      setSavedDelivery(null);
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

  const saveDelivery = async (overrides) => {
    setSavingDelivery(true);
    try {
      const payload = { ...delivery, ...(frameworkAgreementRoute(legalDocs, dmas, project.project_number).route === 'single_task' ? {} : savedConstructionValues(project, delivery)), ...(typeof overrides?.delivery_team === 'string' ? { delivery_team: overrides.delivery_team } : {}), project_id: projectId, client_account_id: project.client_account_id || null, bdm_aad_id: project.bdm_aad_id || null };
      payload.lad_rate = delivery.lad_rate === '' || delivery.lad_rate == null ? null : Number(delivery.lad_rate);
      payload.lad_rate_period = delivery.lad_rate_period || 'week';
      ['pct_programme_override', 'forecast_pc_override', 'lad_exposure_override'].forEach(key => { payload[key] = !!delivery[key]; });
      // Handover updates are saved separately; do not overwrite them from this form.
      Object.keys(payload).filter(key => key.startsWith('handover_')).forEach(key => delete payload[key]);
      // coerce numeric fields
      ["probability", "contract_sum", "pct_programme", "pct_cost", "current_valuation"].forEach((k) => {
        payload[k] = payload[k] === "" || payload[k] == null ? null : Number(payload[k]);
      });
      payload.site_visit_completed = !!payload.site_visit_completed;
      if (deliveryId) {
        await base44.entities.ProjectDelivery.update(deliveryId, payload);
      } else {
        const created = await base44.entities.ProjectDelivery.create(payload);
        if (created?.id) setDeliveryId(created.id);
      }
      if (typeof overrides?.delivery_team === 'string') setDelivery(previous => ({ ...previous, delivery_team: overrides.delivery_team }));
      setSavedDelivery(payload);
    } finally {
      setSavingDelivery(false);
    }
  };

  if (frameworkAgreementRoute(legalDocs, dmas, project.project_number).route === 'single_task') return <SingleTaskDelivery key={projectId} project={project} legalDocs={legalDocs} delivery={delivery} savedDelivery={savedDelivery} feeProposals={feeProposals} setField={setField} onSave={saveDelivery} saving={savingDelivery}
    fees={<FeeProposalSection projectId={projectId} project={project} onChanged={setFeeProposals} deliveryTeam={deliveryTeam} suppliers={suppliers} legalDocs={legalDocs} dmas={dmas}><DeliveryTeam embedded singleTask project={project} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} suppliers={suppliers} /></FeeProposalSection>}
    registers={<><FormSection title="Action Register"><RegisterList title="Action" entityName="ProjectAction" projectId={projectId} project={project} columns={ACTION_COLS} tableColumns={ACTION_TABLE} sortBy="-due_date" addLabel="Add action" /></FormSection><FormSection title="Decision Register"><RegisterList title="Decision" entityName="ProjectDecision" projectId={projectId} project={project} columns={DECISION_COLS} tableColumns={DECISION_TABLE} sortBy="-date_requested" addLabel="Add decision" /></FormSection><ProjectRiskRegister project={project} delivery={delivery} accountMap={accountMap} /></>}
    handover={<ProjectHandoverPack embedded project={project} savingDelivery={savingDelivery} onStarted={loadDelivery} />} />;

  return (
    <DeliveryJourney key={projectId} pdBrDecision={pdBrReview.decision} project={project} delivery={savedDelivery} feeProposals={feeProposals} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} suppliers={suppliers} accountMap={accountMap}>
      <DeliveryScoping project={project} accountMap={accountMap} bdmName={bdmName} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
      <FeeProposalSection projectId={projectId} project={project} onChanged={setFeeProposals} deliveryTeam={deliveryTeam} suppliers={suppliers} legalDocs={legalDocs} dmas={dmas}>
        <DeliveryTeam embedded project={project} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} suppliers={suppliers} />
      </FeeProposalSection>
      <PreConstructionReadiness pdBrReview={pdBrReview} deliveryTeam={deliveryTeam} suppliers={suppliers} accountMap={accountMap} project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} warranties={warranties} feeProposals={feeProposals} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
      <DesignTeam pdBrDecision={pdBrReview.decision} legalDocs={legalDocs} jcts={jcts} warranties={warranties} accountMap={accountMap} deliveryTeam={deliveryTeam} suppliers={suppliers} />
      <ProgrammeMilestones project={project} feeProposals={feeProposals} jcts={jcts} delivery={delivery} />
      <FormSection title="06 · Act"><RegisterList title="Action" description="The simple action log BDMs use every day" entityName="ProjectAction" projectId={projectId} project={project} columns={ACTION_COLS} tableColumns={ACTION_TABLE} sortBy="-due_date" addLabel="Add action" /></FormSection>
      <FormSection title="07 · Decide"><RegisterList title="Decision" description="Lightweight decision & client-approval register" entityName="ProjectDecision" projectId={projectId} project={project} columns={DECISION_COLS} tableColumns={DECISION_TABLE} sortBy="-date_requested" addLabel="Add decision" /></FormSection>
      <ProjectRiskRegister project={project} delivery={delivery} accountMap={accountMap} />
      <DeliveryConstruction project={project} delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery} />
      <DeliveryCloseout delivery={delivery} setField={setField} onSave={saveDelivery} saving={savingDelivery}>
        <ProjectHandoverPack embedded project={project} savingDelivery={savingDelivery} onStarted={loadDelivery} />
      </DeliveryCloseout>
    </DeliveryJourney>
  );
}