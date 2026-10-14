import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {Loader2} from 'lucide-react';
export default function SharePointSourceControls({project,onImported}) {
 const {user}=useAuth();
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[pso,setPso]=useState(null),[lois,setLois]=useState(null);
 if(user?.role!=='admin')return null;
 async function run(action) {
  setBusy(action);setError('');
  try {
   const {data}=await base44.functions.invoke('manageProjectSharePointSources',{projectId:project.id,action});
   if(data.error)throw new Error(data.error);
   if(action==='psoImport'){setPso(data);await onImported?.();}else setLois(data.sources);
  }catch(err){setError(err.response?.data?.error||err.message);}finally{setBusy('');}
 }
 return <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted p-3 text-xs">
  <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={!!busy||!project.link_to_pso} onClick={()=>run('psoImport')}>{busy==='psoImport'&&<Loader2 className="animate-spin"/>}Update PSO from SharePoint</Button><Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={()=>run('loiSources')}>{busy==='loiSources'&&<Loader2 className="animate-spin"/>}Check LOI sources</Button></div>
  <p className="text-muted-foreground">PQ, AA and variations use named approval sections. DMA uses the top final sign-off. LOI folders prefer the best-matching Word filename.</p>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {pso&&<div role="status"><p>{pso.importedFields.length} PSO fields imported from {pso.file}; populated fields are read-only.</p>{pso.warnings.map((warning,i)=><p key={i} className="text-risk-elevated">{warning}</p>)}</div>}
  {lois&&<div role="status" className="space-y-2">{!lois.length&&<p>No linked active LOI documents found for this project.</p>}{lois.map(source=><div key={source.documentId}><p className="font-medium">{source.documentId}: {source.status==='selected'?<a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.name}</a>:'Needs review'}</p><p className="text-muted-foreground">{source.reason}</p>{source.candidates?.map(candidate=><a key={candidate.url} href={candidate.url} target="_blank" rel="noopener noreferrer" className="mr-3 block underline">{candidate.name}</a>)}</div>)}</div>}
 </div>;
}