import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export default function BrokenLinkEditor({item,source,onSaved}) {
 const [open,setOpen]=useState(false),[url,setUrl]=useState(item.url||''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function save(event){event.preventDefault();setBusy(true);setError('');setNotice('');
  try{const {data}=await base44.functions.invoke('getDataQuality',{action:'save_link',source,recordId:item.recordId,url,version:item.version,linkVersion:item.linkVersion||''});if(data.error)throw new Error(data.error);setNotice(data.notice);setOpen(false);await onSaved();}
  catch(error){setError(error.response?.data?.error||error.message);}finally{setBusy(false);}
 }
 if(!item.recordId)return null;
 return <div className="max-w-sm whitespace-normal space-y-2">
  {!open?<Button size="sm" variant="outline" onClick={()=>{setUrl(item.url||'');setOpen(true);setError('');}}>Edit link</Button>:<form onSubmit={save} className="space-y-2">
   <label className="block text-xs font-medium" htmlFor={`link-${item.id}`}>Corrected document link</label>
   <Input id={`link-${item.id}`} type="url" required maxLength={2000} value={url} onChange={event=>setUrl(event.target.value)} disabled={busy}/>
   <p className="text-xs text-muted-foreground">{item.inactive?'Inactive: saved in ALS Hub only, used for PDF reconciliation.':item.dataverse?'Active: saved to Dataverse through your connected account.':'Saved in ALS Hub.'}</p>
   <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy}>{busy?'Saving…':'Save link'}</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button></div>
  </form>}
  {notice&&<p role="status" className="text-xs text-muted-foreground">{notice}</p>}{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
 </div>;
}