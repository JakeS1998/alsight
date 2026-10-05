import React from 'react';
import {useAuth} from '@/lib/AuthContext';
import {aseError} from '@/components/ase/aseClient';
import useASESources from '@/components/ase/useASESources';
import ASESourceCard from '@/components/ase/ASESourceCard';
import ASESourceIdentifiers from '@/components/ase/ASESourceIdentifiers';
import ASEEvidenceTable from '@/components/ase/ASEEvidenceTable';
import ASERegistrySource from '@/components/ase/ASERegistrySource';
import ASESourceCoverage from '@/components/ase/ASESourceCoverage';
export default function ASESourcesPanel({accountId,data}) {
  const {user}=useAuth(),{query,refresh}=useASESources(accountId,user),admin=user?.role==='admin';
  const evidence=(data.sourceEvidence || []).filter(row=>row.external_key?.startsWith('ase-source:') && query.data?.sources.some(source=>source.audit?.id===row.source_refresh_id));
  return <section className="space-y-4 rounded-xl border border-border p-4"><h3 className="font-semibold">ASE connected evidence sources</h3><p className="text-xs text-muted-foreground">Source facts are validated automatically using deterministic identity, date and metric rules. No manual approval is needed. Uncertain records stay context; no-results never mean a clear check. HMRC is excluded. Use the automatic assessment control to refresh all applicable sources and publish together.</p>{query.isPending ? <p role="status" className="text-sm">Loading source connections…</p> : query.error ? <p role="alert" className="text-sm text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Retry</button></p> : <>{admin && <ASESourceIdentifiers key={query.data.account.vat_number+query.data.account.local_authority_code} account={query.data.account}/>}<div className="grid gap-3 md:grid-cols-2"><ASERegistrySource accountId={accountId} model={data.model} admin={admin}/>{query.data.sources.map(source=><ASESourceCard key={source.key} accountId={accountId} source={source} admin={admin} refresh={refresh}/>)}</div></>}<ASESourceCoverage model={data.model}/>{refresh.error && <p role="alert" className="text-sm text-destructive">{aseError(refresh.error)}</p>}{refresh.isSuccess && <p className="text-sm text-success">{refresh.data.evidenceCount} source records collected; {refresh.data.eligibleCount} automatically scoreable. Assessment published as {refresh.data.assessment?.rating_label || 'Not assessed'}.</p>}{!!evidence.length && <ASEEvidenceTable evidence={evidence} title="Collected source evidence"/>}</section>;
}