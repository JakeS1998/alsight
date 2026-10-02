import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createValuationPdf } from '../../shared/valuationPdf.ts';
import { supplierCanManage, supplierAccountId, internalRoles } from '../../shared/valuationAccess.ts';

const response = (message: string, status = 400) => Response.json({ error: message }, { status });
const money = (n: any) => Math.round((Number(n) || 0) * 100) / 100;
const fmtAddr = (a: any) => a ? [a.address_line1, a.address_line2, a.address_city, a.address_county, a.address_postcode].filter(Boolean).join(', ') : '';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return response('Sign in required', 401);
    const { valuationId, projectId, documentType } = await req.json();
    if (typeof valuationId !== 'string' || !valuationId) return response('Valuation required');
    if (typeof projectId !== 'string' || !projectId) return response('Project required');
    if (!['payment_notice', 'interim_certificate', 'statement_of_retention'].includes(documentType)) return response('Choose a document type');
    const contactId = (user as any).contact_dataverse_id || (user as any).data?.contact_dataverse_id;
    const external = user.role === 'project_manager' && !!contactId;
    const project = external || user.role === 'supplier' ? await base44.asServiceRole.entities.Project.get(projectId).catch(() => null) : await base44.entities.Project.get(projectId).catch(() => null);
    if (!project) return response('Project not available', 403);
    const isManager = external && project.project_manager_id === contactId;
    const isSupplierManager = user.role === 'supplier' && project.status !== 'inactive' && await supplierCanManage(base44, supplierAccountId(user), project.dataverse_id);
    if (!isManager && !isSupplierManager && !internalRoles.includes(user.role)) return response('Not authorised for valuations', 403);
    const valuation = await base44.asServiceRole.entities.Valuation.get(valuationId).catch(() => null);
    if (!valuation || valuation.project_id !== projectId) return response('Valuation not available', 404);
    if (valuation.status === 'draft' && (valuation.draft_owner_id || valuation.audit?.find((e: any) => e.kind === 'Created')?.actor_id) !== user.id) return response('Valuation not available', 404);
    const db = base44.asServiceRole.entities;
    const [deliveryPage, adjustments, manager, contractor, clientAccount, previous] = await Promise.all([
      db.ProjectDelivery.filter({ project_id: projectId }, { sort: '-created_date', limit: 1, fields: ['contract_sum', 'contract_start', 'contractor', 'delivery_team'] }),
      db.ProjectDecision.aggregate({ query: { project_id: projectId, status: 'agreed' }, sum: 'financial_adjustment' }),
      project.project_manager_id ? db.Contact.filter({ dataverse_id: project.project_manager_id }, { sort: '-created_date', limit: 1 }) : Promise.resolve({ items: [] }),
      project.contractor_contact_id ? db.Contact.filter({ dataverse_id: project.contractor_contact_id }, { sort: '-created_date', limit: 1 }) : Promise.resolve({ items: [] }),
      project.client_account_id ? db.Account.filter({ $or: [{ id: project.client_account_id }, { dataverse_id: project.client_account_id }] }, { sort: '-created_date', limit: 1 }) : Promise.resolve({ items: [] }),
      db.Valuation.filter({ project_id: projectId }, { sort: '-number', limit: 500 }),
    ]);
    const delivery = deliveryPage.items[0], pm = manager.items[0], con = contractor.items[0], emp = clientAccount.items[0];
    const team = JSON.parse(delivery?.delivery_team || '[]');
    const contractorMember = team.find((member: any) => String(member.role || '').toLowerCase() === 'contractor' && member.supplier_company_number);
    const companyNumber = contractorMember?.supplier_company_number || con?.company_number;
    const contractorAccount = companyNumber ? (await db.Account.filter({ company_number: companyNumber }, { limit: 1 })).items[0] : null;
    const retentionPct = money(valuation.retention_percent);
    const items = (valuation.items || []).map((item: any) => {
      const gross = money(item.previous) + money(item.completed) + money(item.materials);
      const cat = item.retention_category || 'full';
      const rate = cat === 'none' ? 0 : cat === 'half' ? retentionPct / 2 : retentionPct;
      const retentionAmount = money(gross * rate / 100);
      return { description: item.description || '', gross, retentionCategory: cat, retentionAmount, net: money(gross - retentionAmount) };
    });
    const gross = money(items.reduce((s: number, i: any) => s + i.gross, 0));
    const retention = money(items.reduce((s: number, i: any) => s + i.retentionAmount, 0));
    const deductionsTotal = money((valuation.deductions || []).reduce((s: number, d: any) => s + money(d.amount), 0));
    const previousCertified = Math.max(0, ...previous.items.filter((v: any) => v.id !== valuationId && v.number < valuation.number && ['approved', 'paid'].includes(v.status)).map((v: any) => money(v.approved_gross)));
    const net = money(gross - retention);
    const due = money(Math.max(0, gross - retention - deductionsTotal - previousCertified));
    const contractSum = delivery?.contract_sum == null ? 0 : money(delivery.contract_sum + (adjustments.rows[0]?.sum_financial_adjustment || 0));
    let logoBytes: Uint8Array | null = null;
    if (pm?.company_logo_uri) {
      try {
        const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: pm.company_logo_uri });
        const logoResponse = await fetch(signed_url);
        if (logoResponse.ok) logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
      } catch {}
    }
    const data = {
      documentType, status: valuation.status,
      projectName: project.name || '', projectNumber: project.project_number || '', siteAddress: project.site_postcode || '',
      employer: { name: 'Alliance Leisure Services Limited', address: '2430/2440 The Quadrant, Aztec West, Bristol, BS32 4AQ' },
      client: { name: emp?.name || project.client_name || 'Not recorded', address: fmtAddr(emp) },
      contractor: { name: contractorAccount?.name || contractorAccount?.company_name || con?.company_name || delivery?.contractor || 'Not recorded', address: fmtAddr(contractorAccount) || fmtAddr(con) },
      preparedBy: { name: pm?.company_name || pm?.full_name || '', address: fmtAddr(pm) },
      valuationNumber: valuation.number, contractDate: delivery?.contract_start || '',
      periodStart: valuation.period_start || '', periodEnd: valuation.period_end || '', valuationDate: valuation.valuation_date || '',
      paymentDueDate: valuation.payment_due_date || '', notes: valuation.notes || '', retentionPercent: retentionPct,
      items, deductions: (valuation.deductions || []).map((d: any) => ({ description: d.description || '', amount: money(d.amount) })),
      gross, retention, net, previouslyCertified: previousCertified, deductionsTotal, due, contractSum,
    };
    const bytes = createValuationPdf(documentType, data, logoBytes);
    let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const safeName = (project.project_number || project.name || 'project').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60);
    const docLabel = documentType.replace(/_/g, '-');
    return Response.json({ content: btoa(binary), mime: 'application/pdf', filename: `${docLabel}-${safeName}-V${valuation.number}.pdf` });
  } catch (error) {
    console.error('Valuation export failed', error);
    return Response.json({ error: 'Unable to generate this document. Please try again.' }, { status: 500 });
  }
}