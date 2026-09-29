import { INTERNAL_ROLES } from '@/lib/portal';

const internal = INTERNAL_ROLES;
const external = [...internal, 'client', 'supplier'];
// Search only types with a destination in the portal. Linked records resolve through a project the viewer can open.
export const SEARCH_SOURCES = [
  { entity: 'Project', label: 'Projects', roles: external, fields: ['name', 'project_number', 'client_name', 'site_postcode'], title: r => r.name, detail: r => r.project_number, path: r => `/projects/${r.id}` },
  { entity: 'Account', label: 'Accounts', roles: [...external, 'project_manager'], fields: ['name', 'company_name', 'company_number', 'address_city'], title: r => r.name, detail: r => r.company_number, path: r => `/accounts/${r.id}` },
  { entity: 'Contact', label: 'Contacts', roles: internal, fields: ['full_name', 'email', 'company_name'], title: r => r.full_name, detail: r => r.company_name, path: r => `/crm/contacts/${r.id}` },
  { entity: 'Opportunity', label: 'Opportunities', roles: internal, fields: ['title', 'location', 'project_details'], title: r => r.title, detail: r => r.location, path: r => `/opportunities/${r.id}` },
  { entity: 'CRMTask', label: 'Pipeline tasks', roles: internal, fields: ['title', 'description'], title: r => r.title, detail: r => r.description, path: r => `/opportunities/${r.opportunity_id}`, extra: ['opportunity_id'] },
  { entity: 'CRMActivity', label: 'CRM activity', roles: internal, fields: ['subject', 'description'], title: r => r.subject, detail: r => r.description, path: r => `/opportunities/${r.opportunity_id}`, extra: ['opportunity_id'] },
  { entity: 'LegalDocument', label: 'Legal documents', roles: external, fields: ['document_id', 'comments'], title: r => r.document_id, tab: 'drafting', projectKey: 'project_id', projectFormat: 'dataverse' },
  { entity: 'DMA', label: 'Development agreements', roles: [...internal, 'client'], fields: ['document_id', 'comments'], title: r => r.document_id, tab: 'drafting', projectKey: 'project_id', projectFormat: 'dataverse' },
  { entity: 'JCT', label: 'JCT contracts', roles: external, fields: ['document_id', 'comments'], title: r => r.document_id, tab: 'drafting', projectKey: 'project_id', projectFormat: 'dataverse' },
  { entity: 'Warranty', label: 'Warranties', roles: external, fields: ['warranty_id', 'services'], title: r => r.warranty_id, detail: r => r.services, tab: 'warranties', projectKey: 'project_id', projectFormat: 'dataverse' },
  { entity: 'PurchaseOrder', label: 'Purchase orders', roles: [...internal, 'supplier'], fields: ['po_number', 'project_ref'], title: r => r.po_number, detail: r => r.project_ref, tab: 'general', projectKey: 'legal_project_id', projectFormat: 'id', extra: ['legal_project_id'] },
  { entity: 'Invoice', label: 'Invoices', roles: [...internal, 'client'], fields: ['invoice_number', 'client_name'], title: r => r.invoice_number, detail: r => r.client_name, tab: 'finance', projectKey: 'project_id', projectFormat: 'id' },
  { entity: 'ProjectAction', label: 'Project actions', roles: internal, fields: ['action', 'owner'], title: r => r.action, detail: r => r.owner, tab: 'delivery', projectKey: 'project_id', projectFormat: 'id' },
  { entity: 'ProjectRisk', label: 'Project risks', roles: internal, fields: ['title', 'category'], title: r => r.title, tab: 'delivery', projectKey: 'project_id', projectFormat: 'id' },
  { entity: 'ProjectDelivery', label: 'Delivery records', roles: internal, fields: ['scope_summary', 'next_action'], title: r => r.scope_summary || r.next_action, tab: 'delivery', projectKey: 'project_id', projectFormat: 'id' },
  { entity: 'FeeProposal', label: 'Fee proposals', roles: internal, fields: ['services_included', 'services_excluded'], title: r => r.services_included || 'Fee proposal', tab: 'delivery', projectKey: 'project_id', projectFormat: 'id' },
  { entity: 'Valuation', label: 'Valuations', roles: [...internal, 'project_manager'], fields: ['notes', 'submitted_by_name'], title: r => `Valuation ${r.number || ''}`.trim(), tab: 'valuations', projectKey: 'project_id', projectFormat: 'id', extra: ['number'] },
  { entity: 'FrameworkProjectReport', label: 'Framework reports', roles: internal, fields: ['framework_ref', 'project_number', 'site', 'client'], title: r => r.site || r.framework_ref, detail: r => r.framework_ref, path: r => `/framework-reports/${r.id}` },
];

export const escapeSearch = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');