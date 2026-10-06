import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/forms/SearchableSelect';

const TEXT = [['preferred_name','Preferred name'],['linkedin_url','LinkedIn URL'],['office_location','Office location'],['alternative_email','Alternative email'],['preferred_communication','Preferred communication method'],['preferred_times','Preferred contact times'],['known_since','Known since'],['birthday','Birthday (day/month is fine)'],['interests','Interests (comma separated)'],['likes','Likes & preferences'],['dislikes','Preferences / avoid'],['professional_priorities','Professional priorities'],['professional_challenges','Known challenges'],['strategic_objectives','Strategic objectives'],['relationship_notes','Relationship notes'],['personal_context','Personal context']];
const OPTIONS = [['relationship_status','Relationship status',['prospect','new_relationship','developing','established','strong','dormant','former_contact']],['relationship_strength','Relationship strength',['new','developing','strong','cooling','limited','established']],['contact_priority','Contact priority',['standard','important','strategic']]];
const SECTIONS = {
  summary: { text: ['known_since'], options: ['relationship_status','relationship_strength','contact_priority'], owner: true },
  priorities: { text: ['professional_priorities','professional_challenges','strategic_objectives'] },
  notes: { text: ['relationship_notes'] },
  details: { text: ['preferred_name','linkedin_url','office_location','alternative_email','preferred_communication','preferred_times'] },
  intelligence: { text: ['interests','likes','dislikes','personal_context','birthday'] },
};
const ADMIN_FIELDS = [['full_name','Full name'],['first_name','First name'],['last_name','Last name'],['job_title','Job title'],['department','Department'],['email','Business email'],['email2','Alternative business email'],['phone','Business telephone'],['mobile_phone','Mobile']];
const LONG_FIELDS = ['professional_priorities','professional_challenges','strategic_objectives','relationship_notes','personal_context','likes','dislikes'];

export default function ContactProfileEditor({ contact, profile, staff, onSaved, onCancel, isAdmin, section }) {
  const [form, setForm] = useState(profile || {});
  const [details, setDetails] = useState(contact);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const config = SECTIONS[section];
  const input = 'mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm';
  const save = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = Object.fromEntries([...config.text, ...(config.options || [])].map(key => [key, (form[key] || '').trim()]));
      if (config.owner) {data.relationship_owner_contact_id = form.relationship_owner_contact_id || '';data.key_decision_maker=!!form.key_decision_maker;data.relationship_strength_source='user_set';}
      const updated = profile ? await base44.entities.ContactProfile.update(profile.id, data) : await base44.entities.ContactProfile.create({ contact_id: contact.id, ...data });
      if (isAdmin && section === 'details') await base44.entities.Contact.update(contact.id, { first_name: details.first_name || '', last_name: details.last_name || '', full_name: details.full_name.trim(), job_title: details.job_title || '', department: details.department || '', ...(details.email ? { email: details.email } : {}), ...(details.email2 ? { email2: details.email2 } : {}), phone: details.phone || '', mobile_phone: details.mobile_phone || '' });
      onSaved(updated);
    } catch (err) { setError(err.message || 'Unable to save contact.'); } finally { setSaving(false); }
  };
  return <form onSubmit={save} className="space-y-4">
    {isAdmin && section === 'details' && <div className="grid gap-3 sm:grid-cols-2">{ADMIN_FIELDS.map(([key,label]) => <label key={key} className="text-sm">{label}<input required={key === 'full_name'} value={details[key] || ''} onChange={e => setDetails({ ...details, [key]: e.target.value })} className={input} /></label>)}</div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.filter(([key]) => config.options?.includes(key)).map(([key,label,values]) => <label key={key} className="text-sm">{label}<SearchableSelect value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className={input}><option value="">Not set</option>{values.map(v => <option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</SearchableSelect></label>)}
      {config.owner && <label className="text-sm">Relationship owner<SearchableSelect value={form.relationship_owner_contact_id || ''} onChange={e => setForm({ ...form, relationship_owner_contact_id: e.target.value })} className={input}><option value="">Not assigned</option>{staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}</SearchableSelect></label>}
      {TEXT.filter(([key]) => config.text.includes(key)).map(([key,label]) => <label key={key} className={LONG_FIELDS.includes(key) ? 'text-sm sm:col-span-2' : 'text-sm'}>{label}{LONG_FIELDS.includes(key) ? <textarea maxLength={3000} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className={input} /> : <input maxLength={500} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className={input} />}</label>)}
    </div>
    {config.owner && <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.key_decision_maker} onChange={e=>setForm({...form,key_decision_maker:e.target.checked})}/>Key decision-maker</label>}
    <p className="text-xs text-muted-foreground">Record only appropriate information shared in the course of a professional relationship. Avoid sensitive personal details.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><Button disabled={saving || (isAdmin && section === 'details' && !details.full_name?.trim())}>{saving ? 'Saving…' : 'Save changes'}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
  </form>;
}