const field = (key, label, type = 'text', required = false, options = undefined) => ({ key, label, type, required, ...(options ? { options } : {}) });
export const handoverRegisters = {
  om: { label: 'O&M manual', guidance: 'Record operating and maintenance instructions; attach manufacturer manuals where needed.', fields: [field('system','System / equipment','text',true),field('location','Location','text',true),field('manufacturer','Manufacturer'),field('model','Model'),field('operation','Operating instructions','textarea',true),field('maintenance','Maintenance requirements / frequency','textarea',true),field('contact','Maintenance contact'),field('reference','Supporting manual link','url')] },
  hs: { label: 'Health & Safety file', guidance: 'Build the handover safety information. This does not certify statutory compliance; upload specialist reports and certificates as supporting evidence.', fields: [field('subject','Subject / work area','text',true),field('hazards','Residual hazards','textarea',true),field('controls','Safe working / control measures','textarea',true),field('emergency','Emergency / isolation procedure','textarea'),field('owner','Responsible person','text',true),field('review_date','Review date','date'),field('reference','Supporting report link','url')] },
  warranties: { label: 'Warranty schedule', guidance: 'Build a warranty schedule and upload the issued warranties separately; the schedule is not a legal warranty.', fields: [field('supplier','Warrantor / supplier','text',true),field('scope','Equipment / works covered','textarea',true),field('reference','Warranty reference'),field('start','Start date','date'),field('expiry','Expiry date','date'),field('conditions','Conditions / exclusions','textarea'),field('contact','Claims contact'),field('status','Issue status','select',true,['Awaiting issue','Issued','Executed']),field('link','Issued warranty link','url')] },
  training: { label: 'Training register', fields: [field('topic','Training topic / equipment','text',true),field('date','Training date','date',true),field('trainer','Trainer full name','text',true),field('attendees','Attendees (full names)','textarea',true),field('organisation','Organisation'),field('outcome','Competencies / outcome','textarea',true),field('reference','Supporting record link','url')] },
  assets: { label: 'Asset register', fields: [field('reference','Asset ID','text',true),field('name','Asset name','text',true),field('location','Location','text',true),field('manufacturer','Manufacturer'),field('model','Model'),field('serial','Serial number'),field('installed','Installation date','date'),field('warranty_expiry','Warranty expiry','date'),field('maintenance','Maintenance requirements','textarea',true),field('contact','Service contact')] },
  defects: { label: 'Defects register', summary: [field('inspection_date','Inspection date','date',true),field('inspector','Inspector full name','text',true),field('no_outstanding','No outstanding defects','select',true,['No','Yes'])], fields: [field('location','Location','text',true),field('description','Defect description','textarea',true),field('priority','Priority','select',true,['Low','Medium','High']),field('owner','Owner full name','text',true),field('action','Required action','textarea',true),field('due','Due date','date',true),field('status','Status','select',true,['Open','In progress','Resolved']),field('resolved','Resolution date','date')] },
  final_account: { label: 'Final account record', summary: [field('status','Account status','select',true,['Open','Agreed','Closed']),field('contract_sum','Original contract sum (£)','number',true),field('final_value','Final account value (£)','number',true),field('paid','Paid to date (£)','number',true),field('as_at','As at date','date',true),field('owner','Account owner full name','text',true),field('notes','Agreement / outstanding matters','textarea')], fields: [field('reference','Reference'),field('description','Adjustment / variation','textarea',true),field('value','Value (£)','number',true),field('status','Status','select',true,['Pending','Agreed','Rejected'])] }
};
function cleanFields(fields, values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Provide the register fields.');
  return Object.fromEntries(fields.map(f => {
    const value = values[f.key] ?? '';
    if (f.type === 'number') { if (value === '' && !f.required) return [f.key, '']; if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e12) throw new Error(`Enter a valid ${f.label}.`); return [f.key, value]; }
    if (typeof value !== 'string' || value.length > (f.type === 'textarea' ? 1500 : 500) || (f.required && !value.trim())) throw new Error(`Complete ${f.label} within its character limit.`);
    const text = value.trim();
    if (text && f.type === 'select' && !f.options.includes(text)) throw new Error(`Choose ${f.label}.`);
    if (text && f.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(text + 'T00:00:00Z').toISOString().slice(0,10) !== text)) throw new Error(`Enter a valid ${f.label}.`);
    if (text && f.type === 'url') { let url; try { url = new URL(text); } catch { throw new Error(`Enter a valid ${f.label}.`); } if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Supporting links must use HTTPS.'); }
    return [f.key, text];
  }));
}
export function validateHandoverRegister(key, data) {
  const config = handoverRegisters[key];
  if (!config || !data || !Array.isArray(data.rows) || data.rows.length > 50) throw new Error('Choose a supported register with up to 50 entries.');
  const summary = cleanFields(config.summary || [], data.summary || {}), rows = data.rows.map(row => cleanFields(config.fields, row));
  if (!rows.length && key !== 'final_account' && !(key === 'defects' && summary.no_outstanding === 'Yes')) throw new Error('Add at least one entry, or explicitly confirm no outstanding defects.');
  if (key === 'defects' && summary.no_outstanding === 'Yes' && rows.some(row => row.status !== 'Resolved')) throw new Error('Resolve all entries before confirming no outstanding defects.');
  if (key === 'defects' && rows.some(row => row.status === 'Resolved' && !row.resolved)) throw new Error('Record a resolution date for resolved defects.');
  if (key === 'final_account' && ['contract_sum','final_value','paid'].some(k => summary[k] < 0)) throw new Error('Account totals cannot be negative.');
  const result = { summary, rows };
  if (JSON.stringify(result).length > 90000) throw new Error('Register is too large; shorten the entries.');
  return result;
}
export function handoverRegisterLines(key, data) {
  const config = handoverRegisters[key];
  return [...(config.summary || []).map(f => `${f.label}: ${data.summary?.[f.key] ?? ''}`), ...data.rows.flatMap((row, i) => [`Entry ${i + 1}`, ...config.fields.map(f => `${f.label}: ${row[f.key] === '' || row[f.key] == null ? 'Not recorded' : row[f.key]}`)])];
}