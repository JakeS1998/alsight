import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {Loader2} from 'lucide-react';
export default function SharePointSourceControls({project,onImported}) {
 const {user}=useAuth();
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[pso,setPso]=useState(null);
 if(user?.role!=='admin')return null;
 async function run(action) {
  setBusy(action);setError('');
  try {
   const {data}=await base44.functions.invoke('manageProjectSharePointSources',{projectId:project.id,action});
   if(data.error)throw new Error(data.error);
   setPso(data);await onImported?.();
  }catch(err){setError(err.response?.data?.error||err.message);}finally{setBusy('');}
 }
 return <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted p-3 text-xs">
  <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={!!busy||!project.link_to_pso} onClick={()=>run('psoImport')}>{busy==='psoImport'&&<Loader2 className="animate-spin"/>}Update PSO from SharePoint</Button></div>
  <p className="text-muted-foreground">PQ, AA and variations use named approval sections. DMA uses the top final sign-off.</p>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {pso&&<div role="status"><p>{pso.importedFields.length} PSO fields imported from {pso.file}; populated fields are read-only.</p>{pso.warnings.map((warning,i)=><p key={i} className="text-risk-elevated">{warning}</p>)}</div>}

 </div>;
}