import React,{useRef,useState} from 'react';
import {Sparkles,Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import AliceSuggestionInput from '@/components/alice/AliceSuggestionInput';
import aliceFormFields from '@/components/forms/aliceFormFields';
import applyAliceFormFields from '@/components/forms/applyAliceFormFields';
export default function AliceFormPrefill({bodyRef}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),request=useRef(0);
 const fill=async()=>{
  const root=bodyRef.current;if(!root||!text.trim()||busy)return;
  const fields=aliceFormFields(root);setError('');setMessage('');if(!fields.length){setMessage('Open the editable fields first, then ask ALICE to fill them.');return;}
  const token=++request.current;setBusy(true);
  try{
   const {data}=await base44.functions.invoke('prefillPopupForm',{description:text.trim(),title:root.querySelector('h2')?.textContent||'Edit form',fields:fields.map(item=>item.field),localDate:new Date().toLocaleDateString('en-CA'),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});
   if(data.error)throw new Error(data.error);if(token!==request.current||!root.isConnected)return;
   const {applied:count,unmatched}=await applyAliceFormFields(fields,data.patches||[]);if(!root.isConnected)return;setMessage(`${count?`Filled ${count} ${count===1?'field':'fields'}. Review the details before saving.`:'No matching changes were applied. Try naming the fields and values.'}${unmatched?' Some linked records could not be uniquely matched; please select them manually.':''}${data.note?' '+data.note:''}`);
  }catch(failure){if(root.isConnected)setError(failure.response?.data?.error||failure.message||'ALICE could not fill this draft. You can still enter the fields manually.');}
  finally{if(root.isConnected)setBusy(false);}
 };
 return <section data-alice-input className="als-form-alice space-y-2" aria-label="ALICE form prefill"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4"/>ALICE</div><AliceSuggestionInput as={Textarea} mode="form" aria-label="Describe the details for ALICE to fill" placeholder="Describe what to add or change. ALICE will fill the matching fields for review." rows={2} maxLength={3000} value={text} disabled={busy} onValueChange={setText} onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();fill();}}}/><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Draft only. Nothing is saved or sent.</p><Button type="button" size="sm" disabled={busy||!text.trim()} onClick={fill}>{busy?<><Loader2 className="h-4 w-4 animate-spin"/>Filling…</>:'Fill fields'}</Button></div>{message&&<p role="status" className="text-xs text-muted-foreground">{message}</p>}{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}</section>;
}