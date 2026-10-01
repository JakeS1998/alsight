import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { DOCUMENT_TYPE } from '@/lib/portal';

const types = ['equipment_only_agreement', 'single_task_agreement'];
const empty = { document_type: types[0], document_id: '', link_to_file: '', executed: 'no', status: 'active' };
export default function AlternativeAgreementEditor({ project, documents, onSaved }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const candidates = documents.filter(doc => types.includes(doc.document_type) || doc.document_type === 'other');
  const select = value => {
    const doc = candidates.find(row => row.id === value);
    setId(value); setForm(doc ? { ...empty, ...doc, document_type: types.includes(doc.document_type) ? doc.document_type : '' } : empty); setError('');
  };
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { document_type: form.document_type, document_id: form.document_id.trim(), link_to_file: form.link_to_file.trim(), executed: form.executed, status: form.status, project_id: project.dataverse_id || project.id, client_account_id: project.client_account_id || '', bdm_aad_id: project.bdm_aad_id || '', bsm_aad_id: project.bsm_aad_id || '' };
      const record = id ? await base44.entities.LegalDocument.update(id, payload) : await base44.entities.LegalDocument.create(payload);
      onSaved(record); setOpen(false); select('');
    } catch (failure) { setError(failure.message || 'Unable to save agreement.'); }
    finally { setSaving(false); }
  };
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const input = 'w-full rounded-md border border-input bg-background p-2 text-sm';
  return <section className="mb-5 rounded-xl border border-border bg-card p-4">
    <Button type="button" variant="outline" onClick={() => setOpen(!open)} disabled={saving}>Record or classify alternative agreement</Button>
    {open && <form onSubmit={save} className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">Link an existing agreement or classify an Other document. This records a reference; it does not generate or execute a contract.</p>
      <label className="block text-sm">Record<select className={input} value={id} onChange={e => select(e.target.value)} disabled={saving}><option value="">New agreement reference</option>{candidates.map(doc => <option key={doc.id} value={doc.id}>{doc.document_id} · {DOCUMENT_TYPE[doc.document_type]?.label}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Agreement type<select className={input} value={form.document_type} onChange={e => change('document_type', e.target.value)} required disabled={saving}><option value="" disabled>Select agreement type</option>{types.map(type => <option key={type} value={type}>{DOCUMENT_TYPE[type].label}</option>)}</select></label>
        <label className="text-sm">Document reference<input className={input} value={form.document_id} onChange={e => change('document_id', e.target.value)} required disabled={saving} /></label>
        <label className="text-sm">Agreement link<input type="url" className={input} value={form.link_to_file} onChange={e => change('link_to_file', e.target.value)} disabled={saving} /></label>
        <label className="text-sm">Executed<select className={input} value={form.executed} onChange={e => change('executed', e.target.value)} disabled={saving}><option value="no">No</option><option value="yes">Yes</option><option value="po">PO</option></select></label>
        <label className="text-sm">Status<select className={input} value={form.status} onChange={e => change('status', e.target.value)} disabled={saving}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save agreement'}</Button>
    </form>}
  </section>;
}