import { checks, importedEntities, parseList, feeProblems } from './dataQualityRules.ts';
import { qualityEditorFields, qualityEditDescriptions } from './dataQualityEditorFields.ts';
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
export async function qualityEditContext(db, input) {
  if (!checks.some(check => check.key === input.check) || !validId(input.recordId)) throw new Error('Choose a valid record and quality check.');
  let entity = 'Project', record = await (input.check === 'dataverse' || input.check === 'duplicates' ? Promise.resolve(null) : db.Project.get(input.recordId));
  if (input.check === 'dataverse') { if (!importedEntities.includes(input.entity)) throw new Error('Choose a supported record type.'); entity = input.entity; record = await db[entity].get(input.recordId); }
  if (input.check === 'duplicates') { entity = 'Contact'; record = await db.Contact.get(input.recordId); }
  if (!record) throw new Error('Record not found.');
  const project = entity === 'Project' ? record : null;
  if (input.check === 'fees' || input.check === 'supplier') {
    entity = input.check === 'fees' ? 'FeeProposal' : 'ProjectDelivery';
    const page = await db[entity].filter({ project_id: project.id }, { sort: input.check === 'fees' ? '-revision_number' : '-created_date', limit: 1 });
    if (input.check === 'fees') {
      const current = await db.FeeProposal.filter({ project_id: project.id, is_current: true }, { sort: '-revision_number', limit: 1 });
      record = current.items[0] || page.items[0];
    } else record = page.items[0];
    if (!record) throw new Error('The affected project record is no longer available. Refresh checks.');
  }
  let fields = qualityEditorFields[input.check], values = {};
  if (input.check === 'supplier') {
    const team = parseList(record.delivery_team);
    fields = team && team.every(member => member && typeof member === 'object') ? team.map((member, index) => ({ key: `proposal_${index}`, label: `${member.role || 'Team member'} — ${member.supplier_company_number || index + 1}`, type: 'url' })) : [{ key: 'delivery_team', label: 'Repair delivery team data (JSON array)', type: 'textarea' }];
    values = team && fields[0]?.key !== 'delivery_team' ? Object.fromEntries(team.map((member, i) => [`proposal_${i}`, member.fee_proposal_link || ''])) : { delivery_team: record.delivery_team || '[]' };
  } else {
    values = Object.fromEntries(fields.map(f => [f.key, f.type === 'fee_lines' ? (parseList(record[f.key]) || []).map((row, index) => ({ ...(row && typeof row === 'object' ? row : {}), _source_index: index })) : f.type === 'date' ? String(record[f.key] || '').slice(0,10) : record[f.key] ?? '']));
    if (input.check === 'jct') values = { existing_jct_id: '', document_id: '', form_of_jct: '', executed: 'no', link_to_file: '' };
  }
  return { entity, record, project, fields, values, version: record.updated_date || '', description: qualityEditDescriptions[input.check] || 'Edit the affected fields. Saving refreshes the quality checks.' };
}
export function qualityEditorResponse(context) {
  return { entity: context.entity, fields: context.fields, values: context.values, version: context.version, description: context.description };
}
function cleanField(field, value) {
  if (field.type === 'number') { if (value === '') return null; if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Enter a valid ${field.label}.`); return value; }
  if (typeof value !== 'string' || value.length > (field.type === 'textarea' ? 50000 : 2000)) throw new Error(`Enter a valid ${field.label}.`);
  const text = value.trim();
  if (field.type === 'select' && text && !field.options.includes(text)) throw new Error(`Choose ${field.label}.`);
  if (field.type === 'url' && text) { let url; try { url = new URL(text); } catch { throw new Error('Document links must use HTTPS.'); } if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Document links must use HTTPS.'); }
  if (field.type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error('Enter a valid email.');
  if (field.type === 'date') { if (!text) return null; const date = new Date(text + 'T00:00:00Z'); if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== text) throw new Error('Enter a valid completion date.'); return date.toISOString(); }
  return text;
}
async function resolveAccount(db, value) {
  const page = await db.Account.filter({ $or: [{ id: value },{ dataverse_id: value }] }, { limit: 1 });
  const account = page.items[0];
  if (!account || account.account_type !== 'client' || account.status === 'inactive') throw new Error('Choose an active client account.');
  return account;
}
export async function saveQualityEdit(db, input) {
  const context = await qualityEditContext(db, input), { record, project, fields } = context;
  if (typeof input.version !== 'string' || input.version !== context.version) throw new Error('This record changed. Close and reopen the editor before saving.');
  if (!input.values || typeof input.values !== 'object' || Array.isArray(input.values) || JSON.stringify(input.values).length > 100000) throw new Error('Provide valid record changes.');
  const allowed = new Set(fields.map(f => f.key));
  if (Object.keys(input.values).some(key => !allowed.has(key))) throw new Error('Only the displayed quality fields can be edited.');
  const payload = {};
  for (const field of fields) {
    if (field.type === 'fee_lines') continue;
    payload[field.key] = cleanField(field, input.values[field.key] ?? '');
  }
  if (input.check === 'dataverse' && payload.dataverse_id && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(payload.dataverse_id)) throw new Error('Enter the verified source GUID, or leave it blank for native records.');
  if (input.check === 'duplicates') { if (!payload.full_name) throw new Error('Full name is required.'); if (!payload.email) payload.email = null; }
  if (input.check === 'bdm' || input.check === 'bsm') {
    const key = `${input.check}_aad_id`, value = payload[key];
    if (value) {
      const contactCount = await db.Contact.count({ portal_role: input.check, aad_id: value, status: { $ne: 'inactive' } });
      if (!contactCount) { const users = await db.User.filter({ role: input.check, $or: [{ id: value },{ staff_aad_id: value },{ 'data.staff_aad_id': value }] }, 'full_name', 5); if (!users.length) throw new Error('Choose an eligible colleague.'); }
    }
  }
  if (input.check === 'client' && payload.client_account_id) { const account = await resolveAccount(db, payload.client_account_id); payload.client_account_id = account.dataverse_id || account.id; payload.client_name = payload.client_name || account.name; }
  if (input.check === 'fees') {
    const lines = input.values.line_items;
    if (!Array.isArray(lines) || !lines.length || lines.length > 100) throw new Error('Add between 1 and 100 fee lines.');
    const original = parseList(record.line_items) || [];
    const clean = lines.map((line, i) => {
      if (!line || typeof line.description !== 'string' || !line.description.trim() || line.description.length > 1000 || typeof line.riba_stage !== 'string' || !line.riba_stage.trim() || line.riba_stage.length > 100 || line.internal_fee === '' || !Number.isFinite(Number(line.internal_fee))) throw new Error('Each fee line needs a description, stage and numeric amount.');
      if (line._source_index != null && (!Number.isInteger(line._source_index) || line._source_index < 0 || line._source_index >= original.length)) throw new Error('Invalid source fee line. Reopen the editor.');
      return { ...(line._source_index != null && original[line._source_index] && typeof original[line._source_index] === 'object' ? original[line._source_index] : {}), description: line.description.trim(), riba_stage: line.riba_stage.trim(), internal_fee: Number(line.internal_fee) };
    });
    payload.line_items = JSON.stringify(clean);
    if (feeProblems(payload).length) throw new Error('Complete the fee value, basis and line items.');
  }
  if (input.check === 'supplier') {
    const team = parseList(record.delivery_team);
    if (Object.hasOwn(payload, 'delivery_team')) { const repaired = parseList(payload.delivery_team); if (!repaired || repaired.length > 100 || repaired.some(member => !member || typeof member !== 'object' || typeof member.fee_proposal_link !== 'string')) throw new Error('Provide a valid delivery team array with proposal links.'); }
    else { payload.delivery_team = JSON.stringify(team.map((member, i) => ({ ...member, fee_proposal_link: payload[`proposal_${i}`] }))); fields.forEach(field => delete payload[field.key]); }
  }
  if (input.check === 'jct') {
    const ref = project.dataverse_id || project.id;
    if (payload.existing_jct_id) {
      if (!validId(payload.existing_jct_id)) throw new Error('Choose an existing JCT.');
      const existing = await db.JCT.get(payload.existing_jct_id);
      if (!existing || existing.status === 'inactive') throw new Error('Choose an active JCT.');
      if (existing.project_id && ![project.id, project.dataverse_id].includes(existing.project_id)) throw new Error('This JCT belongs to another project; it cannot be reassigned here.');
      await db.JCT.update(existing.id, { project_id: ref, client_account_id: project.client_account_id || '', bdm_aad_id: project.bdm_aad_id || '', project_bsm_aad_id: project.bsm_aad_id || '' });
    } else {
      if (!payload.document_id) throw new Error('Choose an existing JCT or enter a new document reference.');
      if (await db.JCT.count({ document_id: payload.document_id })) throw new Error('That JCT reference already exists. Link the existing record instead.');
      delete payload.existing_jct_id;
      await db.JCT.create({ ...payload, project_id: ref, client_account_id: project.client_account_id || '', bdm_aad_id: project.bdm_aad_id || '', project_bsm_aad_id: project.bsm_aad_id || '', status: 'active' });
    }
  } else await db[context.entity].update(record.id, payload);
  return { saved: true };
}