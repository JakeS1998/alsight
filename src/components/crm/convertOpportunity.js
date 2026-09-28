import { base44 } from '@/api/base44Client';

export async function convertOpportunity(item, account) {
  const project = item.project_id ? { id: item.project_id } : await base44.entities.Project.create({
    name: item.title, description: item.project_details || '',
    client_account_id: account.dataverse_id || account.id, client_name: account.name,
    ...(item.contact_id ? { client_rep_id: item.contact_id } : {}),
    ...(item.budget != null ? { estimated_value: item.budget } : {}),
    ...(item.site_postcode ? { site_postcode: item.site_postcode } : {}),
    live_project: true, status: 'active',
  });
  // Store the link before the other writes so retrying a partial conversion cannot create another project.
  if (!item.project_id) await base44.entities.Opportunity.update(item.id, { project_id: project.id });
  const scope = { scope_summary: item.scope_summary || '', client_objectives: item.client_objectives || '', initial_constraints: item.initial_constraints || '', target_programme: item.target_programme || '', key_stakeholders: item.key_stakeholders || '', funding_route: item.funding_route || '', delivery_team: JSON.stringify(item.design_team || []) };
  if (Object.values(scope).some(value => value && value !== '[]')) {
    const existing = await base44.entities.ProjectDelivery.filter({ project_id: project.id }, { limit: 1 });
    if (existing.items.length) await base44.entities.ProjectDelivery.update(existing.items[0].id, scope);
    else await base44.entities.ProjectDelivery.create({ project_id: project.id, client_account_id: account.dataverse_id || account.id, ...scope });
  }
  if (item.fee_basis || item.fee_lines?.length || item.fee_services_included || item.fee_services_excluded || item.fee_consultants_required) {
    const existing = await base44.entities.FeeProposal.filter({ project_id: project.id }, { limit: 1 });
    const lines = item.fee_lines || [];
    const data = { fee_basis: item.fee_basis || '', status: item.fee_status || 'draft', services_included: item.fee_services_included || '', services_excluded: item.fee_services_excluded || '', consultants_required: item.fee_consultants_required || '', line_items: JSON.stringify(lines), fee_value: lines.reduce((n, row) => n + (Number(row.internal_fee) || 0), 0), date_issued: item.fee_issued_date || undefined, client_approval_date: item.fee_client_approval_date || undefined, link_to_file: item.fee_link_to_file || '', is_current: true, revision_number: 1 };
    if (existing.items.length) await base44.entities.FeeProposal.update(existing.items[0].id, data);
    else await base44.entities.FeeProposal.create({ project_id: project.id, client_account_id: account.dataverse_id || account.id, ...data });
  }
  await base44.entities.Opportunity.update(item.id, { project_id: project.id, status: 'won' });
  return project;
}