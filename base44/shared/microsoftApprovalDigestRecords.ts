const hub = 'https://als-hub.base44.app';
const types = { access_agreement:'Access Agreement', 'Access Agreement Variation':'Access Agreement Variation', additional_works:'Additional Works', appointment_pm:'Appointment (PM)', appointment_pd_cdm:'Appointment (PD CDM)', appointment_architect:'Appointment (Architect)', appointment_pd_br:'Appointment (PD BR)', pcsa:'PCSA', loi:'LOI', equipment_only_agreement:'Equipment-only Agreement', single_task_agreement:'Single-task Agreement', other:'Other' };
const sources = {
  BSS: ['LegalDocument','document_id',null,'drafting'],
  DMA: ['DMA','document_id','Development Agreement','drafting'],
  JCT: ['JCT','document_id','JCT Contract','drafting'],
  CWY: ['Warranty','warranty_id','Warranty','warranties'],
};
const titleParts = title => title.trim().match(/^(?:Approval Requested\s*[:–—-]?\s*)?(.+?)\s+[-–—]\s+((?:BSS|DMA|JCT|CWY)-\d{1,20})$/i);
const field = (details, label) => details?.match(new RegExp(`^\\s*(?:[-*]\\s+)?(?:\\*\\*)?(?:${label})(?:\\*\\*)?\\s*:\\s*(?:\\*\\*)?([^\\r\\n]+)`, 'im'))?.[1]?.trim();
function requestor(approval) {
  const fromDetails = field(approval.details,'Requestor|Requester|Requested by|Submitted by');
  if (fromDetails) return fromDetails.replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1').replace(/\*\*$/, '').trim();
  try {
    const data = JSON.parse(approval.additionalFields || 'null');
    const value = data?.requestor ?? data?.requester ?? data?.Requestor ?? data?.Requester;
    const name = typeof value === 'object' ? value?.displayName || value?.name || value?.email : value;
    if (typeof name === 'string' && name.trim()) return name.trim();
  } catch { /* Unstructured Microsoft approval metadata is optional. */ }
  return 'Not recorded';
}
const known = (actual, ...allowed) => !!actual && allowed.some(value => !!value && actual === value);
function mayReadProject(user, p) {
  if (['admin','director','finance'].includes(user.role)) return true;
  if (user.role === 'bsm') return known(p.bsm_aad_id, user.id, user.staff_aad_id, user.delegate_of);
  if (user.role === 'bdm' && known(p.bdm_aad_id, user.staff_aad_id, user.dataverse_systemuser_id)) return true;
  return ['bdm','regional_director'].includes(user.role) && (known(p.client_account_id,user.account_id) || known(p.account_id,user.account_id) || known(p.bdm_aad_id,user.id,user.delegate_of) || known(p.bsm_aad_id,user.id,user.delegate_of) || known(p.department_id,user.region,user.delegate_region));
}

export async function microsoftApprovalDigestRecords(db, user, approvals) {
  const references = approvals.map(a => titleParts(a.title)?.[2]?.toUpperCase());
  const documents = new Map();
  if (['admin','director','finance','bsm','bdm','regional_director'].includes(user.role)) await Promise.all(Object.entries(sources).map(async ([prefix,[entity,key,type,tab]]) => {
    const ids = references.filter(ref => ref?.startsWith(`${prefix}-`));
    if (!ids.length) return;
    const {items,has_more} = await db[entity].filter({[key]:{$in:ids}}, {limit:25, fields:[key,'project_id',...(type ? [] : ['document_type'])]});
    if (has_more) return;
    for (const d of items) documents.set(d[key], documents.has(d[key]) ? null : {id:d.id, projectId:d.project_id, type:type || types[d.document_type], tab});
  }));
  const ids = [...new Set([...documents.values()].map(d => d?.projectId).filter(Boolean))];
  const {items:projects} = ids.length ? await db.Project.filter({$or:[{id:{$in:ids}},{dataverse_id:{$in:ids}}]}, {limit:25, fields:['id','dataverse_id','name','bdm_aad_id','bsm_aad_id','department_id','client_account_id','account_id']}) : {items:[]};
  return approvals.map((a,i) => {
    const match = documents.get(references[i]);
    const matches = match && projects.filter(p => p.id === match.projectId || p.dataverse_id === match.projectId);
    const project = matches?.length === 1 && mayReadProject(user,matches[0]) ? matches[0] : null;
    return {
      project: project?.name || field(a.details,'Project(?: name)?') || titleParts(a.title)?.[1] || 'Not recorded',
      type: (project && match.type) || field(a.details,'Document type') || 'Not recorded',
      requestor: requestor(a),
      hubUrl: project ? `${hub}/projects/${encodeURIComponent(project.id)}?tab=${match.tab}#document-${encodeURIComponent(match.id)}` : '',
      approvalUrl: a.microsoftUrl,
    };
  });
}