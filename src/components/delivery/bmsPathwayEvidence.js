import { preConstructionAppointments } from '@/components/delivery/preConstructionAppointments';
import contractorAppointment, { savedDeliveryTeam } from '@/components/delivery/contractorAppointment';
import ribaProgrammeEvidence from '@/components/delivery/ribaProgrammeEvidence';
const dated = value => !!value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();
export default function bmsPathwayEvidence({project,delivery={},feeProposals=[],legalDocs=[],dmas=[],jcts=[],warranties=[],registers={},suppliers=[],accountMap={},pdBrDecision,uklfComplete=false,facts={}}) {
 const aa=legalDocs.find(d=>d.document_type==='access_agreement');
 const appointment=contractorAppointment({deliveryTeam:savedDeliveryTeam(delivery),suppliers,accountMap,legalDocs});
 const fee=feeProposals.find(f=>f.is_current)||feeProposals[0];
 const result=(done,detail='',url='')=>({done:!!done,detail,url});
 const pso=key=>result(!!delivery[`pso_${key}_approved_by`]?.trim()&&dated(delivery[`pso_${key}_date`]),`PSO: ${delivery[`pso_${key}_approved_by`]||'approver outstanding'} · ${delivery[`pso_${key}_date`]||'date outstanding'}`,project.link_to_pso);
 const pack=key=>delivery.handover_items?.find(item=>item.key===key);
 const handover=(field,key)=>{
  const assessed=facts.handoverItems?.[key];
  if(assessed)return {...result(assessed.status==='complete'||assessed.status==='not_applicable',assessed.gap||assessed.reason||'Existing handover evidence reviewed.',assessed.link),notApplicable:assessed.status==='not_applicable',reason:assessed.reason};
  return result(delivery[field]==='complete',delivery[`${field}_notes`]||'Uses existing close-out evidence; the full handover checklist remains a separate review.',pack(key)?.link);
 };
 const appts=preConstructionAppointments(legalDocs,pdBrDecision);
 const variation=legalDocs.find(d=>/variation/i.test(d.document_type||'')&&/access|agreement/i.test(d.document_type||''));
 return {
  procurement_route:result(typeof project.procurement_route==='boolean',project.procurement_route===false?'Non-framework route':'UKLF route'),
  requirements:result(delivery.scope_summary?.trim()&&delivery.client_objectives?.trim(),'Scope summary and client objectives in Scope.'),
  funding:result(delivery.funding_route?.trim()&&Number(project.estimated_value)>0,'Existing funding route and indicative project value; not a funding approval.'),
  site_visit:result(delivery.site_visit_completed,'Initial visit recorded in Scope.'),feasibility:result(delivery.feasibility_status==='complete','Existing feasibility status; does not override the other Scope checks.'),
  pso_pq:pso('pq'),pso_aa:pso('aa'),pso_dma:pso('dma'),
  pq_approved:result(facts.hasDigitalPQ?facts.pqApproved:dated(project.pq_approval_date),facts.hasDigitalPQ?`Current digital PQ approval: ${facts.pqReference||'outstanding'}`:'Project PQ approval date from the existing approved project record.',project.link_to_project_questionnaire),
  fee_recorded:result(fee,'Existing current fee proposal.'),fee_accepted:result(fee?.status==='accepted','Uses the current proposal acceptance status, not an issue date.'),
  aa_executed:result(aa?.executed==='yes',aa?.document_id,aa?.link_to_file),dma_executed:result(dmas.some(d=>d.executed==='yes'),dmas[0]?.document_id,dmas[0]?.link_to_file),
  agreement_variation:result(variation?.executed==='yes'&&pso('aa_variations').done,variation?.document_id,variation?.link_to_file),
  contractor_selected:result(appointment.identified||jcts.length||warranties.some(w=>w.category==='contractor'),'Existing contractor/team records.'),
  appointments:result(appts.done,`${appts.completed}/${appts.total} required appointments executed. Architect optional; existing PD BR applicability retained.`),
  contractor_appointment:result(appointment.document?.executed==='yes',appointment.document?.document_id,appointment.document?.link_to_file),
  riba_dates:result(ribaProgrammeEvidence(project).recorded,ribaProgrammeEvidence(project).details.join(' ')),
  actions:{...result(registers[6]?.percent===100,registers[6]?.detail),pending:registers[6]?.percent==null},decisions:{...result(registers[7]?.percent===100,registers[7]?.detail),pending:registers[7]?.percent==null},
  risks:{...result(registers[8]?.percent===100,registers[8]?.detail),pending:registers[8]?.percent==null,subchecks:registers[8]?.checks},
  jct:result(jcts.some(j=>j.executed==='yes'),'Uses executed contract status, not its milestone date.',jcts.find(j=>j.executed==='yes')?.link_to_file),
  warranty_tracker:result(facts.warrantyTracker?.total>0&&facts.warrantyTracker.filed===facts.warrantyTracker.total,facts.warrantyTracker?`${facts.warrantyTracker.filed} of ${facts.warrantyTracker.total} active warranties complete and filed; ${facts.warrantyTracker.overdue} overdue. Maintained on the Warranties tab throughout the project.`:'Checking the live Warranties tab.'),
  progress_meetings:result(facts.meetings?.progress>0||dated(delivery.last_progress_meeting),facts.meetings?.progress>0?`${facts.meetings.progress} progress meetings recorded in Act.`:delivery.last_progress_meeting?'Latest existing meeting: '+delivery.last_progress_meeting:'Record meeting minutes and attendees in Act.'),
  handover_meeting:result(facts.meetings?.handover>0,'Uses client handover meetings recorded in Act. Existing review evidence is retained.'),
  post_review:result(facts.meetings?.post_review>0,'Uses post-project review meetings recorded in Act. Record follow-up actions in the action register.'),
  pc:result(dated(delivery.pc_achieved||project.practical_completion_date),'Practical completion date must have been reached. This does not approve a stage report.'),
  final_account:result(delivery.final_account_status==='closed','Uses the final account closed status. A completed handover status record does not mean that the account is settled.'),
  om:handover('om_manuals','om'),hs:handover('hs_file','hs'),warranties:handover('warranties_status','warranties'),training:handover('training','training'),assets:handover('asset_info','assets'),
  handover_checklist:{...result(facts.handoverReady,'Uses existing handover readiness, including evidence and authorised applicability. No separate checklist is created.'),pending:!!(delivery.handover_started_at&&facts.deliveryUpdatedAt&&delivery.updated_date&&facts.deliveryUpdatedAt!==delivery.updated_date)},
  client_handover:result(delivery.client_handover==='complete','Existing official client handover status.'),uklf:result(uklfComplete,'Existing UKLF framework record/KPI completion.'),lessons:result(delivery.lessons_learned?.trim()||facts.lessons>0,'Uses existing project lessons or the saved lessons learned field; no duplicate lesson is required.'),
 };
}