import { canIssue, fail, hash, parties, riskMetadata, packetPublic } from './riskApprovalData.ts';
import { registeredRiskRecipient } from './riskApprovalRecipients.ts';
export async function issueRiskApproval(base44, user, project, input) {
  if (!canIssue(user, project)) fail('Only the assigned BDM, an administrator or a director can issue this register.', 403);
  const db = base44.asServiceRole.entities;
  if (!Array.isArray(input.steps) || input.steps.length !== 4 || input.steps.some(step => !step || !parties.includes(step.party) || (step.user_id !== '' && (typeof step.user_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(step.user_id)))) || new Set(input.steps.map(step => step.party)).size !== 4 || !input.steps[0].user_id) fail('Choose the first recipient; the other parties can be added later.');
  const selected = input.steps.filter(step => step.user_id);
  if (new Set(selected.map(step => step.user_id)).size !== selected.length) fail('Choose a different registered recipient for each selected party.');
  const { records } = await db.RiskApprovalLock.upsert([{ project_id: project.id }], { key: 'project_id' });
  const lock = records[0]; const token = crypto.randomUUID(); const now = new Date().toISOString();
  const claimed = await db.RiskApprovalLock.updateMany({ id: lock.id, lease_until: { $lt: now } }, { $set: { lease_token: token, lease_until: new Date(Date.now() + 120000).toISOString() } });
  if (!claimed.updated) fail('Another issue is being prepared. Please wait and refresh.', 409);
  try {
  if (await db.RiskApprovalPacket.count({ project_id: project.id, status: 'active' })) fail('Withdraw the active issue before issuing a new version.', 409);
  const steps = [];
  for (const step of input.steps) {
    const recipient = step.user_id ? await registeredRiskRecipient(db, step.user_id) : { user_id: '', email: '', name: '' };
    steps.push({ party: step.party, ...recipient, status: 'waiting' });
  }
  const before = await riskMetadata(db, project.id);
  if (!before.count) fail('Add risks before issuing the register.');
  if (before.count > 500) fail('Approval issues support up to 500 risks.');
  const rows = []; let cursor;
  do {
    const page = await db.ProjectRisk.filter({ project_id: project.id }, { sort: 'reference', limit: 100, ...(cursor ? { cursor } : {}) });
    rows.push(...page.items); cursor = page.has_more ? page.next_cursor : null;
  } while (cursor && rows.length <= 500);
  const after = await riskMetadata(db, project.id);
  if (before.count !== after.count || before.updated !== after.updated || rows.length !== before.count) fail('The register changed while preparing the issue. Please try again.', 409);
  const reference = `RR-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
  const issuedAt = new Date().toISOString();
  const text = JSON.stringify({ reference, projectName: project.name, issuedAt, issuedBy: user.full_name || user.email, rows });
  if (new TextEncoder().encode(text).length > 2000000) fail('This register is too large to issue.');
  const snapshotHash = await hash(text);
  const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: new File([text], `${reference}.json`, { type: 'application/json' }) });
  const currentLock = await db.RiskApprovalLock.get(lock.id);
  if (currentLock.lease_token !== token || currentLock.lease_until < new Date().toISOString()) fail('Issue preparation expired. Please try again.', 409);
  const packet = await db.RiskApprovalPacket.create({ project_id: project.id, project_name: project.name, reference, issued_at: issuedAt, issued_by_id: user.id, issued_by_name: user.full_name || user.email, status: 'active', current_index: 0, snapshot_uri: file_uri, snapshot_hash: snapshotHash, risk_count: before.count, risk_updated_at: before.updated, steps, notification_index: -1, notification_status: 'pending' });
  return { packet: packetPublic(packet) };
  } finally {
    await db.RiskApprovalLock.updateMany({ id: lock.id, lease_token: token }, { $set: { lease_until: '1970-01-01T00:00:00.000Z', lease_token: '' } });
  }
}