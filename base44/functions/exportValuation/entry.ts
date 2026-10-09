import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {portalActor} from '../../shared/portalActor.ts';
import { createValuationPdf } from '../../shared/valuationPdf.ts';
import { supplierCanManage, supplierAccountId, internalRoles } from '../../shared/valuationAccess.ts';

const response = (message: string, status = 400) => Response.json({ error: message }, { status });
const money = (n: any) => Math.round((Number(n) || 0) * 100) / 100;
const fmtAddr = (a: any) => a ? [a.address_line1, a.address_line2, a.address_city, a.address_county, a.address_postcode].filter(Boolean).join(', ') : '';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await portalActor(base44);
    if (!user) return response('Sign in required', 401);
    const input = await req.json();
    const { valuationId, projectId, documentType, action = 'preview' } = input;
    if (typeof valuationId !== 'string' || !valuationId) return response('Valuation required');
    if (typeof projectId !== 'string' || !projectId) return response('Project required');
    if (!['preview', 'issue', 'history', 'copy'].includes(action)) return response('Choose a document action');
    if (['preview', 'issue'].includes(action) && !['payment_notice', 'interim_certificate', 'statement_of_retention'].includes(documentType)) return response('Choose a document type');
    const contactId = (user as any).contact_dataverse_id || (user as any).data?.contact_dataverse_id;
    const external = user.role === 'project_manager' && !!contactId;
    const project = external || user.role === 'supplier' ? await base44.asServiceRole.entities.Project.get(projectId).catch(() => null) : await base44.entities.Project.get(projectId).catch(() => null);
    if (!project) return response('Project not available', 403);
    const isManager = external && project.project_manager_id === contactId;
    const isSupplierManager = user.role === 'supplier' && project.status !== 'inactive' && await supplierCanManage(base44, supplierAccountId(user), project.dataverse_id);
    const assignedManager = !!project.project_manager_id && project.status !== 'inactive' && (await base44.asServiceRole.entities.Contact.filter({ dataverse_id: project.project_manager_id, aad_id: user.id }, { limit: 1, fields: ['aad_id'] })).items.length > 0;
    if (!assignedManager && !isManager && !isSupplierManager && !internalRoles.includes(user.role)) return response('Not authorised for valuations', 403);
    const valuation = await base44.asServiceRole.entities.Valuation.get(valuationId).catch(() => null);
    if (!valuation || valuation.project_id !== projectId) return response('Valuation not available', 404);
    if (valuation.status === 'draft' && (valuation.draft_owner_id || valuation.audit?.find((e: any) => e.kind === 'Created')?.actor_id) !== user.id) return response('Valuation not available', 404);
    const db = base44.asServiceRole.entities;
    if (action === 'history') {
      const page = await db.ValuationDocumentIssue.filter({ valuation_id: valuationId, project_id: projectId }, { sort: '-issued_at', limit: 50, ...(input.cursor ? { cursor: input.cursor } : {}), fields: ['document_type', 'issue_reference', 'authorised_by_name', 'authorised_at', 'issued_by_name', 'issued_at', 'issuer_organisation', 'named_authorised_party', 'contract_reference', 'authority_clause', 'filename'] });
      return Response.json({ ...page, canIssue: assignedManager && ['approved', 'paid'].includes(valuation.status) });
    }
    if (action === 'copy') {
      if (typeof input.issueId !== 'string') return response('Choose an issued document');
      const issue = await db.ValuationDocumentIssue.get(input.issueId).catch(() => null);
      if (!issue || issue.project_id !== projectId || issue.valuation_id !== valuationId) return response('Issued document not available', 404);
      return Response.json({ file_uri: issue.file_uri, filename: issue.filename });
    }
    let issue = null;
    if (action === 'issue') {
      if (!assignedManager) return response('Only the assigned project manager may authorise and issue this document', 403);
      if (!['approved', 'paid'].includes(valuation.status)) return response('Valuation approval is required before formal issue');
      if (!['payment_notice', 'interim_certificate'].includes(documentType)) return response('Formal issue applies to payment notices and interim certificates');
      const clean = (value, max) => typeof value === 'string' && value.trim().length <= max ? value.trim() : '';
      const contractReference = clean(input.contractReference, 300), authorityClause = clean(input.authorityClause, 500), namedParty = clean(input.namedAuthorisedParty, 200);
      if (input.authorityConfirmed !== true || !contractReference || !authorityClause || !namedParty) return response('Confirm your authority for this document and enter the executed contract reference, relevant clause and named authorised party');
      const now = new Date().toISOString();
      issue = { issue_reference: crypto.randomUUID(), project_id: projectId, valuation_id: valuationId, document_type: documentType, authorised_by_id: user.id, authorised_by_name: user.full_name || user.email, authorised_at: now, issued_by_id: user.id, issued_by_name: user.full_name || user.email, issued_at: now, contract_reference: contractReference, authority_clause: authorityClause, named_authorised_party: namedParty, authority_confirmed: true, bdm_aad_id: project.bdm_aad_id || '', bsm_aad_id: project.bsm_aad_id || '', department_id: project.department_id || '' };
    }
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
    if (issue) issue.issuer_organisation = pm?.company_name || 'Not recorded';
    const data = {
      issue, isDraftDocument: !issue && documentType !== 'statement_of_retention',
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
    const filename = `${issue ? 'issued-' : documentType === 'statement_of_retention' ? '' : 'draft-'}${docLabel}-${safeName}-V${valuation.number}${issue ? '-' + issue.issue_reference : ''}.pdf`;
    if (issue) {
      const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: new File([bytes], filename, { type: 'application/pdf' }) });
      await db.ValuationDocumentIssue.create({ ...issue, file_uri, filename });
    }
    return Response.json({ content: btoa(binary), mime: 'application/pdf', filename });
  } catch (error) {
    console.error('Valuation export failed', error);
    return Response.json({ error: 'Unable to generate this document. Please try again.' }, { status: 500 });
  }
}