import { documentNeedsApproval } from './documentApprovalEligibility.ts';
import { approvalQuery } from './documentApprovalReads.ts';
import { withPortalUserNames } from './portalUserNames.ts';
import { fullName, missingFullName } from './fullName.ts';
const url = 'https://alsight.base44.app';
export const escapeApprovalEmail = value => String(value ?? '').replace(/\s*\u2014\s*/g, ', ').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
export const approvalDigestDay = () => new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/London', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
export const pendingDigestQuery = { status:'pending', source_requires_approval:{$ne:false}, $or:[{response:{$exists:false}},{response:null},{response:''}] };
function requestVisible(user, request) {
  if (request.routing_assigned || ['admin','director','finance'].includes(user.role)) return true;
  const matches = (value, alternatives) => !!value && alternatives.filter(Boolean).includes(value);
  const data = { ...user.data, ...user };
  if (user.role === 'bsm') return matches(request.bsm_aad_id,[user.id,data.staff_aad_id,data.delegate_of]);
  if (user.role === 'bdm') return matches(request.bdm_aad_id,[user.id,data.staff_aad_id,data.dataverse_systemuser_id,data.delegate_of]) || matches(request.department_id,[data.region,data.delegate_region]);
  if (user.role === 'regional_director') return matches(request.department_id,[data.region,data.delegate_region]);
  return user.role === 'client' && matches(request.client_account_id,[data.account_id]) && (['dma','warranties'].includes(request.source_table) || ['access_agreement','additional_works','equipment_only_agreement','single_task_agreement','other'].includes(request.document_type));
}
export async function approvalDigestContent(base44, recipient) {
  const db = base44.asServiceRole.entities, email = recipient.email.trim().toLowerCase();
  recipient = (await withPortalUserNames(db, [recipient]))[0];
  const query = { ...approvalQuery({email}, {view:'pending'}), ...pendingDigestQuery };
  let cursor, approvalRows = '';
  let total = 0;
  do {
    const page = await db.DocumentApprovalRequest.filter(query, {sort:'requested_at',limit:25,...(cursor ? {cursor} : {})});
    const permitted = page.items.filter(request => requestVisible(recipient,request));
    const documents = [];
    for (const [table, entity] of Object.entries({documents:'LegalDocument',dma:'DMA',warranties:'Warranty'})) {
      const ids = permitted.filter(request => request.source_table === table).map(request => request.source_id);
      if (ids.length) documents.push(...(await db[entity].filter({dataverse_id:{$in:ids}}, {limit:50,fields:['dataverse_id','project_id','drafted_date','approval_date','approval_status']})).items.map(document => ({...document,table})));
    }
    const projectIds = [...new Set(documents.map(document => document.project_id).filter(Boolean))];
    const projects = projectIds.length ? (await db.Project.filter({$or:[{dataverse_id:{$in:projectIds}},{id:{$in:projectIds}}]}, {limit:50,fields:['dataverse_id']})).items : [];
    for (const request of permitted) {
      const source = documents.find(document => document.table === request.source_table && document.dataverse_id === request.source_id);
      if (!source || !documentNeedsApproval(source) || !projects.some(project => project.dataverse_id === source.project_id || project.id === source.project_id)) continue;
      const link = `${url}/approvals?approval=${encodeURIComponent(request.id)}`;
      const type = request.source_table === 'dma' ? 'Development agreement' : request.source_table === 'warranties' ? 'Warranty' : 'Legal document';
      const requested = request.requested_at && Number.isFinite(Date.parse(request.requested_at)) ? new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}).format(new Date(request.requested_at)) : 'Not recorded';
      approvalRows += `<tr><td style="padding:16px 18px;border:1px solid #e5e7eb;border-radius:7px;background-color:#eaf4fb;"><p style="margin:0 0 5px;font-size:11px;color:#5f7586;">${escapeApprovalEmail(type)}${request.document_number ? ' · '+escapeApprovalEmail(request.document_number) : ''}</p><p style="margin:0 0 6px;font-size:17px;line-height:1.3;font-weight:bold;color:#102642;">${escapeApprovalEmail(request.document_title)}</p><p style="margin:0 0 4px;font-size:14px;color:#102642;">${escapeApprovalEmail(request.project_name || 'Project not recorded')}${request.project_number ? ' · '+escapeApprovalEmail(request.project_number) : ''}</p>${request.client_name ? `<p style="margin:0 0 4px;font-size:13px;color:#5f7586;">${escapeApprovalEmail(request.client_name)}</p>` : ''}<p style="margin:0 0 10px;font-size:12px;color:#5f7586;">Requested ${escapeApprovalEmail(requested)}${fullName(request.requested_by_name) !== missingFullName ? ' by '+escapeApprovalEmail(fullName(request.requested_by_name)) : ''}</p><a href="${link}" style="color:#102642;text-decoration:underline;font-size:14px;font-weight:bold;">Review this approval</a></td></tr><tr><td height="12" style="height:12px;font-size:1px;line-height:1px;">&#160;</td></tr>`;
      total++;
    }
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return { count:total, variables:{report_date:new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()),greeting:recipient.full_name !== missingFullName ? `Hello, ${escapeApprovalEmail(recipient.full_name)}.` : 'Hello.',approval_count:total,approval_rows:approvalRows} };
}