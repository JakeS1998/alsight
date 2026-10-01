export default function pathwayStageStatus(stage, progress, breakdown, register, delivery, fee, legalDocs, dmas, jcts) {
  if (progress == null) return 'Insufficient Data';
  if (progress === 100) return breakdown?.some(c => !c.done) ? 'Complete with Conditions' : 'Complete';
  const recorded = {
    1: !!(delivery.scope_summary || delivery.client_objectives || delivery.feasibility_status === 'in_progress' || delivery.site_visit_completed),
    2: !!fee,
    3: legalDocs.length > 0 || dmas.length > 0 || !!fee,
    4: legalDocs.some(d => d.document_type?.startsWith('appointment_')) || jcts.length > 0,
    9: !!delivery.contract_start,
    10: !!(delivery.handover_started_at || delivery.pc_achieved || delivery.final_account_status || delivery.client_handover),
  };
  const hasRegister = register?.checks?.some(item => !item.label.startsWith('No '));
  // Existing readiness checks do not record an explicit block. An incomplete
  // checklist is not independently promoted into a blocked gateway decision.
  return progress > 0 || recorded[stage.id] || breakdown?.some(c => c.done) || hasRegister ? 'In Progress' : 'Not Started';
}