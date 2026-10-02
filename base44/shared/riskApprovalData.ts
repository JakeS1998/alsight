export const parties = ['pm', 'contractor', 'client', 'als'];
export const partyLabels = { pm: 'PM', contractor: 'Contractor', client: 'Client', als: 'ALS' };
export const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join('');
export const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
export function canIssue(user, project) {
  if (['admin', 'director'].includes(user.role)) return true;
  const ids = [user.id, user.staff_aad_id || user.data?.staff_aad_id, user.delegate_of || user.data?.delegate_of].filter(Boolean);
  return user.role === 'bdm' && !!project.bdm_aad_id && ids.includes(project.bdm_aad_id);
}
export async function riskMetadata(db, projectId) {
  const result = await db.ProjectRisk.aggregate({ query: { project_id: projectId }, max: 'updated_date' });
  return { count: result.rows[0]?.count || 0, updated: result.rows[0]?.max_updated_date || '' };
}
export const isStale = (packet, meta) => packet.risk_count !== meta.count || (packet.risk_updated_at || '') !== meta.updated;
export const packetPublic = packet => packet ? Object.fromEntries(['id','project_id','project_name','reference','issued_by_name','issued_at','status','current_index','snapshot_hash','risk_count','steps','notification_status','notification_at','withdrawn_by','withdrawn_at'].map(key => [key, packet[key]])) : null;
export async function approvalSummary(db, projectId) {
  const [pages, meta] = await Promise.all([
    Promise.all(parties.map(party => db.RiskApprovalPacket.filter({ project_id: projectId, 'steps.party': party }, { sort: '-created_date', limit: 1 }))),
    riskMetadata(db, projectId),
  ]);
  const approvals = []; const packets = new Map();
  pages.forEach((page, index) => {
    const packet = page.items[0]; if (!packet) return;
    const stale = isStale(packet, meta);
    packets.set(packet.id, { ...packetPublic(packet), stale });
    const step = packet.steps.find(entry => entry.party === parties[index]);
    if (!stale && ['active','completed'].includes(packet.status) && step?.status === 'accepted') approvals.push({ stakeholder: step.party, approved: true, approver_name: step.name, recorded_at: step.decided_at, verified: true });
  });
  const current = Array.from(packets.values());
  return { count: meta.count, packets: current, packet: current[0] || null, stale: current.some(packet => packet.stale), approvals };
}
export async function loadSnapshot(base44, packet) {
  const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: packet.snapshot_uri, expires_in: 60 });
  const response = await fetch(signed_url);
  if (!response.ok) fail('Unable to read the issued register.', 500);
  const text = await response.text();
  if (await hash(text) !== packet.snapshot_hash) fail('The issued register failed its integrity check.', 409);
  return JSON.parse(text);
}