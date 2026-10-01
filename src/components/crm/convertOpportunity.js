import { base44 } from '@/api/base44Client';
import { SCOPING_KEYS } from '@/components/delivery/ScopingFields';
import { chance } from '@/components/crm/crm';
import { opportunityFeeData } from '@/components/crm/opportunityFeeData';

export async function convertOpportunity(item, account) {
  if (item.status !== 'won') throw new Error('Mark the opportunity Won before creating a project.');
  const project = item.project_id ? { id: item.project_id } : await base44.entities.Project.create({
    name: item.title, description: item.scope_summary || item.project_details || '',
    client_account_id: account.dataverse_id || account.id, client_name: account.name,
    ...(item.owner_id ? { bdm_aad_id: item.owner_id } : {}),
    ...(item.contact_id ? { client_rep_id: item.contact_id } : {}),
    ...((item.confirmed_project_value ?? item.budget) != null ? { estimated_value: item.confirmed_project_value ?? item.budget } : {}),
    ...(item.site_postcode ? { site_postcode: item.site_postcode } : {}),
    live_project: true, status: 'active',
  });
  // Store the link before the other writes so retrying a partial conversion cannot create another project.
  if (!item.project_id) await base44.entities.Opportunity.update(item.id, { project_id: project.id });
  const scope = { ...Object.fromEntries(SCOPING_KEYS.map(key => [key, item[key] ?? ''])), scope_summary: item.scope_summary || item.project_details || '', probability: chance(item), site_visit_completed: !!item.site_visit_completed, contract_start: item.expected_project_start || undefined, delivery_team: JSON.stringify(item.design_team || []) };
  if (Object.values(scope).some(value => value && value !== '[]')) {
    const existing = await base44.entities.ProjectDelivery.filter({ project_id: project.id }, { limit: 1 });
    if (existing.items.length) await base44.entities.ProjectDelivery.update(existing.items[0].id, scope);
    else await base44.entities.ProjectDelivery.create({ project_id: project.id, client_account_id: account.dataverse_id || account.id, bdm_aad_id: item.owner_id || undefined, ...scope });
  }
  if (item.fee_basis || item.fee_lines?.length || item.design_team?.length || item.alliance_fee != null || item.confirmed_alliance_fee != null || item.fee_services_included || item.fee_services_excluded || item.fee_consultants_required) {
    const existing = await base44.entities.FeeProposal.filter({ project_id: project.id }, { limit: 1 });
    const { lines, totals } = opportunityFeeData(item);
    const data = { fee_basis: item.fee_basis || '', status: item.fee_status || 'draft', services_included: item.fee_services_included || '', services_excluded: item.fee_services_excluded || '', consultants_required: item.fee_consultants_required || '', line_items: JSON.stringify(lines), fee_value: totals.alsFee, external_cost: totals.supplierFees, date_issued: item.fee_issued_date || undefined, client_approval_date: item.fee_client_approval_date || undefined, link_to_file: item.fee_link_to_file || '', is_current: true, revision_number: 1 };
    if (existing.items.length) await base44.entities.FeeProposal.update(existing.items[0].id, data);
    else await base44.entities.FeeProposal.create({ project_id: project.id, client_account_id: account.dataverse_id || account.id, bdm_aad_id: item.owner_id || undefined, ...data });
  }
  const links = await base44.entities.CRMProjectLink.filter({ project_id: project.id }, { limit: 1 });
  if (!links.items.length) await base44.entities.CRMProjectLink.create({ project_id: project.id, opportunity_id: item.id, account_id: item.account_id, owner_id: item.owner_id, line_manager_id: item.line_manager_id || '' });
  await base44.entities.Opportunity.update(item.id, { project_id: project.id, status: 'won' });
  return project;
}