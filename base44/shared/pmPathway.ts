import { approvalSummary } from './riskApprovalData.ts';
const pick = (record, fields) => Object.fromEntries(fields.filter(key => record?.[key] !== undefined).map(key => [key, record[key]]));
const deliveryFields = ['scope_summary','client_objectives','initial_constraints','target_programme','key_stakeholders','site_visit_completed','feasibility_status','feasibility_notes','next_action','contract_sum','contractor','contract_start','original_pc','forecast_pc','pct_programme','pct_cost','current_valuation','variations','eot','eot_notes','lad_exposure','lad_exposure_notes','key_site_issues','last_progress_meeting','next_progress_meeting','pc_achieved','final_account_status','defects_period','retention','om_manuals','hs_file','warranties_status','training','asset_info','client_handover','lessons_learned'];
const documentFields = ['id','document_id','document_type','account_id','executed','date_of_execution','approval_date','drafted_date','sent_to_client','sent_for_signing','riba_stage'];
const registers = {
  actions: { entity: 'ProjectAction', fields: ['id','action','owner','due_date','priority','status'], sort: 'due_date' },
  decisions: { entity: 'ProjectDecision', fields: ['id','decision_title','requested_by','required_by','decision_maker','decision','date_agreed','financial_adjustment','programme_impact','status'], sort: '-date_requested' },
  risks: { entity: 'ProjectRisk', fields: ['id','reference','title','category','owner','mitigation','target_resolution','rag','risk_index','status'], sort: '-created_date' },
};
export async function pmPathwayRegister(db, projectId, kind, cursor) {
  const config = registers[kind];
  if (!config || (cursor != null && (typeof cursor !== 'string' || cursor.length > 2000))) throw new Error('Invalid register request');
  return await db[config.entity].filter({ project_id: projectId }, { sort: config.sort, limit: 50, fields: config.fields, ...(cursor ? { cursor } : {}) });
}
export async function pmPathway(db, project) {
  const projectId = project.id;
  const documentQuery = { project_id: { $in: [projectId, project.dataverse_id].filter(Boolean) } };
  const [deliveryPage, proposalPage, docs, dmas, jcts, warranties, actions, decisions, risks, riskReview] = await Promise.all([
    db.ProjectDelivery.filter({ project_id: projectId }, { sort: '-created_date', limit: 1 }),
    db.FeeProposal.filter({ project_id: projectId, is_current: true }, { sort: '-created_date', limit: 1, fields: ['id','status','is_current','revision_number','client_approval_date','date_issued','ohp_surveys_pct','ohp_riba57_pct','ohp_surveys_type','ohp_surveys_fixed'] }),
    db.LegalDocument.filter(documentQuery, { limit: 200, fields: documentFields }),
    db.DMA.filter(documentQuery, { limit: 50, fields: documentFields }),
    db.JCT.filter(documentQuery, { limit: 50, fields: documentFields }),
    db.Warranty.filter(documentQuery, { limit: 200, fields: ['id','warranty_id','category','warranty_status','date_of_execution'] }),
    pmPathwayRegister(db, projectId, 'actions'), pmPathwayRegister(db, projectId, 'decisions'), pmPathwayRegister(db, projectId, 'risks'),
    approvalSummary(db, projectId),
  ]);
  const raw = deliveryPage.items[0] || {};
  let team = [];
  try { const parsed = JSON.parse(raw.delivery_team || '[]'); if (Array.isArray(parsed)) team = parsed; } catch {}
  const companyNumbers = [...new Set(team.map(member => member.supplier_company_number).filter(Boolean))];
  const accounts = companyNumbers.length ? await db.Account.filter({ company_number: { $in: companyNumbers } }, { limit: 250, fields: ['id','dataverse_id','company_number','name'] }) : { items: [] };
  const supplierName = number => accounts.items.find(account => account.company_number === number)?.name || '';
  const contractors = team.filter(member => String(member.role || '').trim().toLowerCase() === 'contractor').map(member => ({
    ...pick(member, ['role','supplier_company_number','task_fee','task_ohp']),
    name: supplierName(member.supplier_company_number) || 'Contractor',
    fees: pick(member.fees || {}, ['riba_1','riba_2','riba_3','riba_4','riba_5_7']),
    contractor_ohp: member.contractor_ohp === null ? null : Object.fromEntries(['riba_1','riba_2','riba_3','riba_4','riba_5_7'].map(stage => [stage, pick(member.contractor_ohp?.[stage] || {}, ['type','value'])])),
    ...(Array.isArray(member.contractor_fees) ? { contractor_fees: member.contractor_fees.map(fee => pick(fee, ['id','type','stage','description','amount'])) } : {}),
  }));
  const delivery = { ...pick(raw, deliveryFields), delivery_team: JSON.stringify(contractors) };
  const proposal = proposalPage.items[0];
  return {
    delivery, contractors, team: team.map(member => ({ role: member.role || 'Team member', name: supplierName(member.supplier_company_number) || 'Not recorded' })),
    contractorOhp: proposal ? pick(proposal, ['ohp_surveys_pct','ohp_riba57_pct','ohp_surveys_type','ohp_surveys_fixed']) : {},
    feeProposals: proposal ? [pick(proposal, ['id','status','is_current','revision_number','client_approval_date','date_issued'])] : [],
    legalDocs: docs.items, dmas: dmas.items, jcts: jcts.items, warranties: warranties.items,
    suppliers: accounts.items, accountMap: Object.fromEntries(accounts.items.filter(account => account.dataverse_id).map(account => [account.dataverse_id, account])),
    actions, decisions, risks, riskCount: riskReview.count, approvals: riskReview.approvals,
  };
}