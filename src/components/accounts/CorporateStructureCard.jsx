import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { aseRequest,aseError } from '@/components/ase/aseClient';
import CorporateStructureNode from '@/components/accounts/CorporateStructureNode';
export default function CorporateStructureCard({account}) {
  const {user}=useAuth();
  const query=useQuery({queryKey:['account-group',account.id,account.parent_account_id,user?.id,user?.role],queryFn:()=>aseRequest('structure',{accountId:account.id}),staleTime:60000});
  return <section className="account-panel"><h2>Corporate structure</h2><p className="mb-4 text-xs text-muted-foreground">Blackflag-reported controlling parent and current PSCs, alongside accessible recorded group links. Source dates and control bands are shown; ownership is not independently verified.</p>{query.isPending ? <p role="status" className="text-sm">Loading linked group organisations…</p> : query.error ? <p role="alert" className="text-sm text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : <><ul className="max-h-96 space-y-3 overflow-y-auto pr-2" aria-label="Recorded corporate group">{query.data.nodes.filter(node=>!node.parentId).map(node=><CorporateStructureNode key={node.id} node={node} nodes={query.data.nodes} currentId={account.id} ancestorIds={query.data.ancestorIds}/>)}</ul>{query.data.nodes.length===1 && <p className="mt-3 text-xs text-muted-foreground">No other accessible group relationships are recorded. This does not prove the organisation has no parent or subsidiaries.</p>}{query.data.warnings.map(warning=><p className="mt-3 text-xs text-muted-foreground" key={warning}>{warning}</p>)}</>}</section>;
}