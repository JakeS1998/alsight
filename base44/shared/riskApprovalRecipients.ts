import { fail, isStale, riskMetadata, packetPublic } from './riskApprovalData.ts';
import { withPortalUserNames } from './portalUserNames.ts';
export async function registeredRiskRecipient(db, userId) {
  if (typeof userId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(userId)) fail('Choose a registered recipient.');
  const recipient = await db.User.get(userId);
  if (!recipient?.email || recipient.email.toLowerCase() === 'jakesavage31@gmail.com') fail('Choose a visible registered portal recipient.');
  const [namedRecipient] = await withPortalUserNames(db, [recipient]);
  return { user_id: recipient.id, email: recipient.email, name: namedRecipient.full_name || recipient.email };
}
export async function addRiskRecipient(db, packet, input) {
  if (packet.status !== 'active') fail('This issue is no longer active.', 409);
  if (isStale(packet, await riskMetadata(db, packet.project_id))) fail('The live register has changed. Issue a new version before adding recipients.', 409);
  const index = packet.steps.findIndex(step => step.party === input.party);
  if (index < packet.current_index || index < 0 || packet.steps[index].user_id || packet.steps[index].status !== 'waiting') fail('Choose an unassigned party in the remaining approval sequence.');
  if (packet.steps.some(step => step.user_id && step.user_id === input.user_id)) fail('Choose a different registered recipient for each party.');
  const recipient = await registeredRiskRecipient(db, input.user_id);
  const steps = packet.steps.map((step, position) => position === index ? { ...step, ...recipient } : step);
  const current = index === packet.current_index;
  const updated = await db.RiskApprovalPacket.updateMany({ id: packet.id, status: 'active', current_index: packet.current_index, steps: packet.steps }, { $set: { steps, ...(current ? { notification_status: 'sending' } : {}) } });
  if (!updated.updated) fail('This issue changed while adding the recipient. Refresh and try again.', 409);
  // A single-record update emits the invitation event only when this party is next.
  if (current) await db.RiskApprovalPacket.update(packet.id, { notification_status: 'pending' });
  return { packet: packetPublic(await db.RiskApprovalPacket.get(packet.id)) };
}