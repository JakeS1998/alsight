import {loadHandover} from './handoverDataset.ts';
export async function pathwayBmsFacts(base44,project) {
 // The caller has already verified internal role and user-scoped access to this project.
 const db=base44.asServiceRole.entities;
 const [deliveryPage,pqPage,lessons]=await Promise.all([
  base44.entities.ProjectDelivery.filter({project_id:project.id},{sort:'-created_date',limit:1}),
  db.ProjectQuestionnaire.filter({project_id:project.id},{sort:'-created_date',limit:1}),
  db.AllianceLesson.count({project_id:project.id}),
 ]);
 const delivery=deliveryPage.items[0]||{},pq=pqPage.items[0];
 const [pack,round]=await Promise.all([
  delivery.handover_started_at?loadHandover(base44,project,delivery):null,
  pq?.approval_round_id?db.PQApprovalRound.get(pq.approval_round_id):null,
 ]);
 const pqApproved=!!(pq?.status==='submitted'&&round?.status==='approved'&&round.questionnaire_id===pq.id&&pq.revision===round.questionnaire_revision+1&&round.steps?.length&&round.current_index===round.steps.length&&round.steps.every(step=>step.status==='approved'&&step.verification_method==='email_otp'));
 return {lessons,hasDigitalPQ:!!pq?.approval_round_id,pqApproved,pqReference:round?.reference||'',handoverReady:pack?.ready===true,handoverStarted:!!pack,deliveryUpdatedAt:delivery.updated_date||null,handoverItems:pack?Object.fromEntries(pack.items.map(item=>[item.key,{status:item.status,gap:item.gap,link:item.link,reason:item.decision?.reason}])):{}};
}