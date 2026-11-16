import React,{useState} from 'react';
import {ExternalLink,Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function InsuranceCertificate({policy}) {
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[url,setUrl]=useState('');
 const value=String(policy.certificate_url||'').trim();
 if(/^https?:\/\//i.test(value))return <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold underline"><ExternalLink className="h-4 w-4"/>Open insurance certificate</a>;
 if(!value||!policy.dataverse_id)return <p className="text-sm text-muted-foreground">No certificate file attached.</p>;
 async function open(){
  setLoading(true);setError('');const popup=window.open('','_blank');if(popup)popup.opener=null;
  try{
   const {data}=await base44.functions.invoke('getInsuranceCertificate',{policyId:policy.id});
   const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:data.file_uri});
   setUrl(signed_url);if(popup)popup.location.replace(signed_url);
  }catch(e){if(popup)popup.close();setError(e.response?.data?.error||e.message||'Unable to open the certificate.');}
  finally{setLoading(false);}
 }
 return <div className="space-y-2"><Button variant="outline" disabled={loading} onClick={open}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<ExternalLink className="h-4 w-4"/>}{loading?'Loading certificate…':'Open insurance certificate'}</Button>{url&&<a href={url} target="_blank" rel="noopener noreferrer" className="block text-sm underline">Open downloaded certificate</a>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}