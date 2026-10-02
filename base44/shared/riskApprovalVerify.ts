import { fail, hash, isStale, riskMetadata, loadSnapshot, packetPublic } from './riskApprovalData.ts';
export async function recipientAction(base44, user, packet, input) {
  const db = base44.asServiceRole.entities;
  const step = packet.steps[packet.current_index];
  if (packet.status !== 'active' || !step || step.user_id !== user.id || step.email.toLowerCase() !== user.email.toLowerCase()) fail('This issue is not awaiting your acceptance.', 403);
  if (isStale(packet, await riskMetadata(db, packet.project_id))) fail('The live register has changed. The BDM must issue a new version.', 409);
  if (input.action === 'send_code') {
    const recent = await db.RiskApprovalChallenge.filter({ packet_id: packet.id, user_id: user.id }, { sort: '-created_date', limit: 1 });
    if (recent.items[0] && Date.now() - Date.parse(recent.items[0].sent_at) < 60000) fail('Wait one minute before requesting another code.', 429);
    const random = new Uint32Array(1); crypto.getRandomValues(random);
    const code = String(100000 + random[0] % 900000);
    if (await db.RiskApprovalChallenge.count({ packet_id: packet.id, user_id: user.id, sent_at: { $gte: new Date(Date.now() - 86400000).toISOString() } }) >= 10) fail('Daily verification-code limit reached. Try again tomorrow.', 429);
    const now = new Date(); const challengeId = crypto.randomUUID();
    const challenge = await db.RiskApprovalChallenge.create({ packet_id: packet.id, user_id: user.id, step_index: packet.current_index, code_hash: await hash(`${challengeId}:${code}`), session_hash: challengeId, sent_at: now.toISOString(), expires_at: new Date(now.getTime() + 600000).toISOString(), attempts: 0, used: false });
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: step.email, subject: `ALSight verification code — ${packet.reference}`, text: `Your risk-register verification code is ${code}. It expires in 10 minutes. This code verifies your review of ${packet.reference} for ${packet.project_name}; it is not a portal login code. Do not share it.`, from_name: 'ALSight' });
    } catch (error) { await db.RiskApprovalChallenge.update(challenge.id, { used: true }); throw error; }
    return { challenge_id: challenge.id };
  }
  if (typeof input.challenge_id !== 'string' || input.challenge_id.length > 100) fail('Request a verification code first.');
  const challenge = await db.RiskApprovalChallenge.get(input.challenge_id);
  if (!challenge || challenge.packet_id !== packet.id || challenge.user_id !== user.id || challenge.step_index !== packet.current_index || challenge.used || Date.parse(challenge.expires_at) < Date.now()) fail('Verification expired. Request a new code.', 403);
  if (input.action === 'verify') {
    if (typeof input.code !== 'string' || !/^\d{6}$/.test(input.code)) fail('Enter the six-digit code.');
    if (challenge.attempts >= 5) fail('Too many attempts. Request a new code.', 429);
    const claimed = await db.RiskApprovalChallenge.updateMany({ id: challenge.id, attempts: challenge.attempts, used: false }, { $inc: { attempts: 1 } });
    if (!claimed.updated) fail('Verification already in progress. Please try again.', 409);
    if (await hash(`${challenge.session_hash}:${input.code}`) !== challenge.code_hash) fail('The verification code is incorrect.', 403);
    const session = crypto.randomUUID() + crypto.randomUUID();
    await db.RiskApprovalChallenge.update(challenge.id, { session_hash: await hash(session), code_hash: '' });
    return { verification_session: session, snapshot: await loadSnapshot(base44, packet) };
  }
  if (!['accept','reject'].includes(input.action)) fail('Unknown approval action.');
  if (typeof input.verification_session !== 'string' || input.verification_session.length > 200 || await hash(input.verification_session) !== challenge.session_hash || challenge.code_hash !== '') fail('Verify your email before recording a decision.', 403);
  if (typeof input.comment !== 'string' || input.comment.length > 2000) fail('Comments must be no more than 2,000 characters.');
  if (input.action === 'accept' && input.confirmed !== true) fail('Confirm that you have reviewed and accept this issued version.');
  if (input.action === 'reject' && !input.comment.trim()) fail('Provide a reason for declining.');
  const steps = packet.steps.map((entry, index) => index === packet.current_index ? { ...entry, status: input.action === 'accept' ? 'accepted' : 'rejected', decided_at: new Date().toISOString(), verification_method: 'email_otp', decision_id: crypto.randomUUID(), comment: input.comment.trim() } : entry);
  const next = input.action === 'accept' ? packet.current_index + 1 : packet.current_index;
  const updated = await db.RiskApprovalPacket.updateMany({ id: packet.id, status: 'active', current_index: packet.current_index, steps: packet.steps }, { $set: { steps, current_index: next, status: input.action === 'reject' ? 'rejected' : next === 4 ? 'completed' : 'active', notification_status: next < 4 && input.action === 'accept' ? 'sending' : 'pending' } });
  if (!updated.updated) fail('A decision has already been recorded or the issue was withdrawn.', 409);
  // Single-record update emits the entity event; the compare-and-set above intentionally does not.
  if (next < 4 && input.action === 'accept') await db.RiskApprovalPacket.update(packet.id, { notification_status: 'pending' });
  await db.RiskApprovalChallenge.update(challenge.id, { used: true });
  return { packet: packetPublic(await db.RiskApprovalPacket.get(packet.id)) };
}