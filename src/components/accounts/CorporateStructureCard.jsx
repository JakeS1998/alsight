import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { aseRequest,aseError } from '@/components/ase/aseClient';
import CorporateStructureNode from '@/components/accounts/CorporateStructureNode';
import CorporateOwnershipFlag from '@/components/accounts/CorporateOwnershipFlag';
import SharedPSCCorporations from '@/components/accounts/SharedPSCCorporations';
export default function CorporateStructureCard({account}) {
  const {user}=useAuth();
  const query=useQuery({queryKey:['account-group','companies-house-psc-v3',account.id,account.company_number,user?.id,user?.role],queryFn:()=>aseRequest('structure',{accountId:account.id}),staleTime:60000});
  return <section className="account-panel"><h2>Corporate structure</h2><p className="mb-4 text-xs text-muted-foreground">Companies House PSC links · parents, siblings and subsidiaries.</p>{query.isPending ? <p role="status" className="text-sm">Checking Companies House PSC relationships…</p> : query.error ? <p role="alert" className="text-sm text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : <><ul className="max-h-96 space-y-3 overflow-y-auto pr-2" aria-label="Companies House PSC corporate structure">{query.data.nodes.filter(node=>!node.parentId).map(node=><CorporateStructureNode key={node.id} node={node} nodes={query.data.nodes} currentId={account.id} ancestorIds={query.data.ancestorIds}/>)}</ul>{query.data.nodes.length===1 && <p className="mt-3 text-xs text-muted-foreground">No corporate group links were established from the current PSC records.</p>}<CorporateOwnershipFlag ownership={query.data.ownership}/><SharedPSCCorporations data={query.data.shared_corporations}/>{query.data.warnings.map(warning=><p className="mt-3 text-xs text-muted-foreground" key={warning}>{warning}</p>)}</>}</section>;
}