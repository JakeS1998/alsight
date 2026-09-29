import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';

export const isLegacyProject = project => {
  const match = /^PROJ\s*0*(\d+)$/i.exec((project.project_number || '').trim());
  return !!match && Number(match[1]) < 600;
};

const normalize = value => ` ${String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')} `;
const legacyName = project => normalize((project.name || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(refurbishment|refurb)\s*$/i, '')).trim();

export const matchesProjectPO = (po, project) => {
  if (isLegacyProject(project)) {
    if (po.legal_project_id) return po.legal_project_id === project.id;
    const name = legacyName(project);
    const detail = (po.notes || '').split(/\bDetail\s*:/i).pop();
    return name.length >= 8 && normalize(detail).includes(` ${name} `);
  }
  return !!project.project_number && !isLegacyProject(project) && /^PROJ\s*\d+$/i.test(project.project_number) && po.project_ref === project.project_number;
};

export const findProjectForPO = (po, projects) => {
  const matches = projects.filter(project => matchesProjectPO(po, project));
  return matches.length === 1 ? matches[0] : null;
};

export async function loadProjectPOs(project, supplierCompanyNumber) {
  if (!project.project_number) return [];
  const query = isLegacyProject(project)
    ? { $or: [
      { legal_project_id: project.id },
      { notes: { $regex: legacyName(project).split(' ')[0], $options: 'i' } },
    ] }
    : { project_ref: project.project_number };
  if (supplierCompanyNumber) query.supplier_company_number = supplierCompanyNumber;
  const orders = await filterAll(base44.entities.PurchaseOrder, query);
  return orders.filter(po => matchesProjectPO(po, project));
}