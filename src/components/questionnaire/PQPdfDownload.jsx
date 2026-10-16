import React,{useState} from 'react';
import {Download,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {base44} from '@/api/base44Client';
import pqContext from '@/components/questionnaire/pqContext';
export default function PQPdfDownload({project,subject,record,dirty,busy}) {
 const [exporting,setExporting]=useState(false),[error,setError]=useState('');
 const download=async()=>{
  setExporting(true);setError('');
  try{
   const {data}=await base44.functions.invoke('manageProjectQuestionnaire',{action:'export_pdf',...pqContext(project.id,subject)});
   if(data.error)throw new Error(data.error);
   const bytes=Uint8Array.from(atob(data.content),char=>char.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
   const link=document.createElement('a');link.href=url;link.download=data.filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }catch(e){setError(e.response?.data?.error||e.message||'Unable to download questionnaire.');}
  finally{setExporting(false);}
 };
 return <div className="space-y-1"><Button type="button" size="sm" variant="outline" disabled={exporting||busy||dirty||!record} onClick={download}>{exporting?<Loader2 className="animate-spin"/>:<Download/>}{exporting?'Preparing PDF…':'Download PQ PDF'}</Button>{dirty&&<p className="text-xs text-muted-foreground">Save changes before exporting.</p>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}