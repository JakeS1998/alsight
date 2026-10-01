const managerServices = 'project manager|project management|(^|[^a-z])pm([^a-z]|$)';

export function supplierAccountId(user: any): string {
  return user.account_id || user.data?.account_id;
}

export async function supplierCanManage(base44: any, accountId: string, projectDvId: string): Promise<boolean> {
  if (!accountId || !projectDvId) return false;
  const [appointments, warranties] = await Promise.all([
    base44.asServiceRole.entities.LegalDocument.filter({ project_id: projectDvId, account_id: accountId, document_type: 'appointment_pm', status: 'active' }, '-created_date', 1),
    base44.asServiceRole.entities.Warranty.filter({ project_id: projectDvId, status: 'active', services: { $regex: managerServices, $options: 'i' }, $or: [{ account_id: accountId }, { supplier_id: accountId }] }, '-created_date', 1),
  ]);
  return (appointments as any[]).length > 0 || (warranties as any[]).length > 0;
}

export const internalRoles = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'];