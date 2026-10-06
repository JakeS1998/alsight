import { base44 } from '@/api/base44Client';
export const STAGES = [
  { value: 'lead', label: 'Lead', probability: 10 }, { value: 'qualified', label: 'Qualified', probability: 20 },
  { value: 'scope_development', label: 'Scope Development', probability: 35 }, { value: 'design_feasibility', label: 'Design / Feasibility', probability: 50 },
  { value: 'proposal_preparation', label: 'Proposal Preparation', probability: 60 }, { value: 'proposal_submitted', label: 'Proposal Submitted', probability: 70 },
  { value: 'negotiation', label: 'Negotiation / Review', probability: 80 }, { value: 'preferred_partner', label: 'Preferred Partner', probability: 90 },
  { value: 'on_hold', label: 'On Hold', probability: 0 }, { value: 'won', label: 'Won', probability: 100 }, { value: 'lost', label: 'Lost', probability: 0 },
];
export const stageLabel = value => STAGES.find(s => s.value === (value || 'lead'))?.label || 'Lead';
export const chance = item => item.probability ?? (STAGES.find(s => s.value === (item.stage || 'lead'))?.probability ?? 10);
export const weighted = item => (Number(item.budget) || 0) * chance(item) / 100;
export const isoToday = () => new Date().toISOString().slice(0, 10);
export async function logCRMActivity(item, user, type, subject, description = '') {
  return base44.entities.CRMActivity.create({ opportunity_id: item.id, account_id: item.account_id, type, occurred_at: new Date().toISOString(), subject, description, ...(item.contact_id ? {contact_id:item.contact_id} : {}), owner_id: item.owner_id || user?.id, line_manager_id: item.line_manager_id || user?.data?.line_manager_id || user?.line_manager_id || '', author_id: user?.id || '', author_name: user?.full_name || user?.email || 'Team member' });
}
export async function updateCRMOpportunity(item, patch, user) {
  if(patch.expected_decision_date==='')patch.expected_decision_date=null;
  const next = { ...item, ...patch };
  if (patch.stage && patch.stage !== (item.stage || 'lead')) {
    patch.stage_entered_at = new Date().toISOString();
    patch.probability = patch.stage === 'on_hold' ? chance(item) : STAGES.find(s => s.value === patch.stage)?.probability ?? chance(item);
    patch.status = patch.stage === 'won' ? 'won' : patch.stage === 'lost' ? 'lost' : 'open';
  }
  Object.assign(next, patch);
  patch.weighted_value = Math.round((Number(next.budget) || 0) * chance(next) / 100 * 100) / 100;
  patch.weighted_alliance_fee = Math.round((Number(next.alliance_fee) || 0) * chance(next) / 100 * 100) / 100;
  const result = await base44.entities.Opportunity.update(item.id, patch);
  const changes = ['stage', 'probability', 'budget', 'alliance_fee', 'expected_decision_date', 'owner_id', 'fee_status'].filter(key => patch[key] !== undefined && patch[key] !== item[key]);
  if (changes.length) await logCRMActivity(item, user, patch.stage && patch.stage !== item.stage ? 'stage_change' : 'system', patch.stage && patch.stage !== item.stage ? `Stage changed: ${stageLabel(item.stage)} → ${stageLabel(patch.stage)}` : 'Opportunity details updated', changes.map(key => `${key.replaceAll('_', ' ')}: ${item[key] ?? '—'} → ${patch[key] ?? '—'}`).join('\n') + (patch.stage_entered_at && item.stage_entered_at ? `\nPrevious stage entered: ${item.stage_entered_at}\nStage exited: ${patch.stage_entered_at}\nPrevious stage duration: ${Math.max(0,Math.floor((Date.parse(patch.stage_entered_at)-Date.parse(item.stage_entered_at))/86400000))} days` : ''));
  return result;
}
export async function createCRMOpportunity(data, user) {
  const matches = await base44.entities.Opportunity.filter({ account_id: data.account_id, title: data.title.trim() }, { limit: 1 });
  if (matches.items.length) throw new Error('An opportunity with this name already exists for this client. Open the existing record instead.');
  const stage = data.stage || 'lead';
  const currentUser = await base44.auth.me();
  const probability = STAGES.find(s => s.value === stage)?.probability ?? 10;
  return base44.entities.Opportunity.create({ ...data, expected_decision_date:data.expected_decision_date || null, title: data.title.trim(), owner_id: currentUser.id, owner_name: (user?.id === currentUser.id && user.full_name) || currentUser.full_name || currentUser.email, line_manager_id: currentUser.data?.line_manager_id || currentUser.line_manager_id || '', stage, probability, stage_entered_at: new Date().toISOString(), status: 'open', weighted_value: Math.round((Number(data.budget) || 0) * probability) / 100, weighted_alliance_fee: 0 });
}