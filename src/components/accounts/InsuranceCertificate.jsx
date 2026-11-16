import React,{useState} from 'react';
import {Download,Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function InsuranceCertificate({policy}) {
 const [loading,setLoading]=useState(false),[error,setError]=useState('');
 const value=String(policy.certificate_url||'').trim(),direct=/^https?:\/\//i.test(value);
 if(!value||(!direct&&!policy.dataverse_id))return <p className="text-sm text-muted-foreground">No certificate file attached.</p>;
 async function download(){
  setLoading(true);setError('');
  try{
   let fileUrl=value,filename='Insurance certificate';
   if(!direct){
    const {data}=await base44.functions.invoke('getInsuranceCertificate',{policyId:policy.id});
    const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:data.file_uri});
    fileUrl=signed_url;filename=data.filename||filename;
   }
   const response=await fetch(fileUrl);
   if(!response.ok)throw new Error('Unable to download the certificate. Please try again.');
   const objectUrl=URL.createObjectURL(await response.blob()),link=document.createElement('a');
   link.href=objectUrl;link.download=filename;document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
  }catch(e){setError(e.response?.data?.error||e.message||'Unable to download the certificate.');}
  finally{setLoading(false);}
 }
 return <div className="space-y-2"><Button variant="outline" disabled={loading} onClick={download}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Download className="h-4 w-4"/>}{loading?'Downloading certificate…':'Download insurance certificate'}</Button>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}