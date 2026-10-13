export async function supplierCommissionFsf(base44, account) {
  const keys = [account.company_number, account.id, account.dataverse_id].filter(Boolean);
  const saved = await base44.entities.FeeProposalFsf.filter({ 'supplier_rates.supplier_key': { $in: keys } }, { limit: 1000, fields: ['fee_proposal_id', 'project_id', 'supplier_rates'] });
  if (saved.has_more) throw new Error('FSF history is too large for a complete average.');
  if (!saved.items.length) return [];
  const proposals = await base44.entities.FeeProposal.filter({ id: { $in: saved.items.map(row => row.fee_proposal_id) }, is_current: { $ne: false }, status: { $ne: 'lost' } }, { sort: '-revision_number', limit: 1000, fields: ['project_id', 'revision_number'] });
  if (proposals.has_more) throw new Error('Fee proposal history is incomplete; average unavailable.');
  if (!proposals.items.length) return [];
  const aliases = [...new Set(proposals.items.map(row => row.project_id).filter(Boolean))];
  const projects = await base44.entities.Project.filter({ $or: [{ id: { $in: aliases } }, { dataverse_id: { $in: aliases } }] }, { limit: 1000, fields: ['project_number', 'dataverse_id'] });
  if (projects.has_more) throw new Error('FSF project links are incomplete; average unavailable.');
  const byAlias = new Map(), byProposal = new Map(saved.items.map(row => [row.fee_proposal_id, row]));
  for (const project of projects.items) for (const alias of [project.id, project.dataverse_id].filter(Boolean)) {
    byAlias.set(alias, byAlias.has(alias) ? null : project);
  }
  const rates = new Map();
  for (const proposal of proposals.items) {
    const project = byAlias.get(proposal.project_id), fsf = byProposal.get(proposal.id);
    if (!project?.project_number || ![project.id, project.dataverse_id].includes(fsf.project_id)) continue;
    const rate = fsf.supplier_rates.find(row => keys.includes(row.supplier_key) && Number.isFinite(row.fsf_pct) && row.fsf_pct >= 0 && row.fsf_pct <= 100);
    // A recorded zero is valid. One current proposal per project takes precedence over COMS.
    if (rate && !rates.has(project.project_number)) rates.set(project.project_number, { project_ref: project.project_number, avg_commission_rate: rate.fsf_pct, source: 'fee_proposal_fsf' });
  }
  return [...rates.values()];
}