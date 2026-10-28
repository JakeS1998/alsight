import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { YES_NO_FIELDS } from '@/components/framework/frameworkKpiFields';
import FrameworkWideKpiFields from '@/components/framework/FrameworkWideKpiFields';
export default function FrameworkWideKpiForm({record,onClose}) {
 const [form,setForm]=useState(record),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const cache=useQueryClient(),set=(key,value)=>setForm(previous=>({...previous,[key]:value}));
 async function save(event) {
  event.preventDefault();setSaving(true);setError('');
  try {
   const values=Object.fromEntries([...YES_NO_FIELDS.map(([key])=>key),'high_level_review_date','high_level_evidence'].map(key=>[key,form[key] || '']));
   await base44.entities.FrameworkWideKpi.update(record.id,values);
   await cache.invalidateQueries({queryKey:['framework-wide-kpis']});onClose();
  } catch(failure) {setError(failure.response?.data?.error || failure.message || 'Unable to save the Framework-wide review.');}
  finally {setSaving(false);}
 }
 return <form onSubmit={save} className="space-y-4"><FrameworkWideKpiFields form={form} set={set} disabled={saving}/>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2"><Button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save framework-wide KPIs'}</Button><Button disabled={saving} variant="outline" type="button" onClick={onClose}>Cancel</Button></div></form>;
}