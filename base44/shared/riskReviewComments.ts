import { fail, loadSnapshot } from './riskApprovalData.ts';
import { withPortalUserNames } from './portalUserNames.ts';
export async function saveRiskReviewComment(base44, user, packet, input) {
  if (typeof input.risk_id !== 'string' || input.risk_id.length > 100) fail('Choose a risk row.');
  if (typeof input.comment !== 'string' || !input.comment.trim() || input.comment.length > 2000) fail('Enter a comment of up to 2,000 characters.');
  const snapshot = await loadSnapshot(base44, packet);
  const row = snapshot.rows.find(row => row.id === input.risk_id);
  if (!row) fail('This risk is not in the issued register.');
  const db = base44.asServiceRole.entities;
  if (await db.RiskReviewComment.count({ packet_id: packet.id, author_id: user.id }) >= 100) fail('Comment limit reached for this issue.');
  const [author] = await withPortalUserNames(db, [user]);
  await db.RiskReviewComment.create({ packet_id: packet.id, project_id: packet.project_id, risk_id: row.id, risk_reference: String(row.reference || ''), risk_title: String(row.title || ''), author_id: user.id, author_name: author.full_name || user.email, comment: input.comment.trim() });
  return { ok: true };
}