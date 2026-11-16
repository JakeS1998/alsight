import React,{useState} from 'react';
import {ExternalLink,Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function InsuranceCertificate({policy}) {
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[url,setUrl]=useState(''),[expiresAt,setExpiresAt]=useState(0);
 const value=String(policy.certificate_url||'').trim(),direct=/^https?:\/\//i.test(value);
 if(!value||(!direct&&!policy.dataverse_id))return <p className="text-sm text-muted-foreground">No certificate file attached.</p>;
 async function prepare(){
  const popup=window.open('about:blank','_blank');
  if(popup){popup.opener=null;popup.document.title='Loading insurance certificate';popup.document.body.textContent='Loading insurance certificate…';}
  setLoading(true);setError('');setUrl('');
  try{
   const {data}=await base44.functions.invoke('getInsuranceCertificate',{policyId:policy.id});
   const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:data.file_uri,expires_in:300});
   setExpiresAt(Date.now()+270000);setUrl(signed_url);
   if(popup&&!popup.closed)popup.location.replace(signed_url);
   else if(!popup)setError('Your browser blocked the new tab. Select Open insurance certificate to open the ready file.');
  }catch(e){if(popup&&!popup.closed)popup.close();setError(e.response?.data?.error||e.message||'Unable to open the certificate.');}
  finally{setLoading(false);}
 }
 function openReady(event){
  if(!direct&&Date.now()>=expiresAt){event.preventDefault();return prepare();}
 }
 return <div className="space-y-2">{direct||url?<Button variant="outline" asChild><a href={direct?value:url} target="_blank" rel="noopener noreferrer" onClick={openReady}><ExternalLink className="h-4 w-4"/>Open insurance certificate</a></Button>:<Button variant="outline" disabled={loading} onClick={prepare}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<ExternalLink className="h-4 w-4"/>}{loading?'Loading certificate…':'Load insurance certificate'}</Button>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}