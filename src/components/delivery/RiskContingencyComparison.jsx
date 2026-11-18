import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import { isClientContingency } from '@/components/delivery/clientContingency';
import { riskMoney } from '@/components/delivery/riskRegisterColumns';

export default function RiskContingencyComparison({ projectId, items }) {
  const summary = useQuery({
    queryKey: ['risk-contingency', projectId],
    queryFn: async () => (await base44.functions.invoke('getRiskContingency', { projectId })).data,
    retry: false,
  });
  const contingency = Math.round(items.filter(isClientContingency).reduce((sum, line) => sum + additionalFeeTotal(line), 0) * 100);
  const data = summary.data;
  const shortfall = Math.max(0, (data?.weightedPence ?? 0) - contingency);
  return <section aria-label="Client contingency comparison" className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
    <h5 className="font-semibold">Client contingency vs risk register</h5>
    {summary.isPending ? <p role="status">Checking risk register…</p> : summary.isError ? <p role="alert">Couldn’t compare contingency with the risk register. <Button size="sm" variant="outline" onClick={() => summary.refetch()} disabled={summary.isFetching}>Try again</Button></p> : <>
      <div className="flex flex-wrap gap-x-6 gap-y-1"><span>Proposal allowance: <strong>{riskMoney(contingency / 100)}</strong></span><span>Known weighted Client risks: <strong>{data.priced ? riskMoney(data.weightedPence / 100) : '—'}</strong></span></div>
      <div aria-live="polite">
        {shortfall > 0 && data.priced > 0 && <p className="font-semibold text-destructive">Contingency shortfall: {data.missing ? 'at least ' : ''}{riskMoney(shortfall / 100)}.</p>}
        {data.missing > 0 ? <p className="text-muted-foreground">{data.missing} open Client {data.missing === 1 ? 'risk is' : 'risks are'} missing a cost or valid ratings; coverage can’t be confirmed.</p> : data.priced === 0 ? <p className="text-muted-foreground">No open Client risks to compare.</p> : shortfall === 0 ? <p className="text-success">The allowance covers the weighted cost of open Client risks.</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">Excluding VAT. Each cost is weighted by its risk index out of 25. Closed and Contractor risks are excluded.</p>
    </>}
  </section>;
}