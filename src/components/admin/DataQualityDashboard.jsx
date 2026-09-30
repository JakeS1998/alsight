import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import DataQualityCards from '@/components/admin/DataQualityCards';
import DataQualityIssues from '@/components/admin/DataQualityIssues';
import useDataQuality from '@/components/admin/useDataQuality';

export default function DataQualityDashboard() {
  const { user } = useAuth();
  const quality = useDataQuality();
  if (user?.role !== 'admin') return null;
  const check = quality.summary?.checks.find(item => item.key === quality.selected);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-heading text-xl font-semibold">Data quality monitoring</h2><p className="mt-1 text-sm text-muted-foreground">Select a check to review affected records. Checks are read-only and never change the dataset.</p>
        <p className="mt-1 text-xs text-muted-foreground">Stale projects are excluded and remain managed manually.</p>
        {quality.summary && <p className="mt-2 text-xs text-muted-foreground">Last checked: {new Date(quality.summary.checkedAt).toLocaleString('en-GB')}</p>}
      </div>
      <Button variant="outline" onClick={quality.refresh} disabled={quality.checking || quality.loading}><RefreshCw className={quality.checking ? 'animate-spin' : ''} />{quality.checking ? 'Checking…' : 'Refresh checks'}</Button>
    </div>
    {quality.error && <p role="alert" className="text-sm text-destructive">{quality.error}</p>}
    {quality.checking ? <p role="status" className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">Checking project, contact, account and legal records…</p> : quality.summary && <>
      <DataQualityCards checks={quality.summary.checks} selected={quality.selected} onSelect={quality.setSelected} />
      {check && <DataQualityIssues check={check} result={quality.result} loading={quality.loading} onMore={quality.loadMore} />}
    </>}
  </div>;
}