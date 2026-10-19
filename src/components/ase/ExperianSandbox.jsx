import React from 'react';
import {useMutation} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {aseError} from '@/components/ase/aseClient';

export default function ExperianSandbox() {
  const sample=useMutation({mutationFn:async()=>{
    const {data}=await base44.functions.invoke('manageExperianSandbox',{action:'sample'});
    if(data.error) throw new Error(data.error);
    return data;
  }});
  const report=sample.data;
  const fields=report ? [['Sample company',report.companyName],['Sample registration',report.sampleRegistration],['Commercial Delphi score',report.creditScore],['Experian risk band',report.riskBand],['Credit limit',report.creditLimit ? `${report.creditLimit}${report.currency ? ` ${report.currency}` : ''}` : report.creditLimit],['CCJs in last 12 months',report.ccjsLast12Months],['Accounts date',report.accountsDate]] : [];
  return <section className="rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Experian Commercial Credit</h3><span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold">Sandbox only</span></div>
    <p className="mt-2 text-xs text-muted-foreground">Administrator connection check using Experian’s fixed sample company, 99999999. This is not a report on this organisation. Results are not saved as evidence and never change ASE scores, ratings or assessments.</p>
    <Button className="mt-3" size="sm" variant="outline" disabled={sample.isPending} onClick={()=>sample.mutate()}>{sample.isPending ? 'Connecting to Experian sandbox…' : 'Load sandbox sample'}</Button>
    {sample.isPending && <p role="status" className="mt-2 text-xs text-muted-foreground">Authenticating securely and retrieving test data…</p>}
    {sample.error && <p role="alert" className="mt-3 text-sm text-destructive">{aseError(sample.error)}</p>}
    {report && !sample.error && <div className="mt-4 space-y-3">
      <p role="status" className="text-xs font-semibold text-success">Sandbox response received · Test data, not live company information</p>
      <dl className="grid gap-3 text-xs sm:grid-cols-2">{fields.map(([label,value])=><div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value ?? 'Not supplied by Experian'}</dd></div>)}</dl>
      <p className="text-xs text-muted-foreground">Retrieved {new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(report.fetchedAt))} UK time. Live reporting requires Experian production access.</p>
    </div>}
  </section>;
}