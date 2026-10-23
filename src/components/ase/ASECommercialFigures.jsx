import React from 'react';
import { formatCurrency } from '@/lib/portal';
import ASECommercialEvidence from '@/components/ase/ASECommercialEvidence';
import '@/components/ase/ase-commercial-figures.css';

export default function ASECommercialFigures({data,historical=false,expandedEvidence=false}) {
  const contractTotals = data.exposure_basis==='contract_total';
  const exposure = contractTotals ? data.total_contract_value : data.annualised_value;
  const available = Number.isFinite(data.percentage);
  const proxy = data.comparison_basis==='balance_sheet_total';
  const netAssetsProxy = proxy && data.comparison_denominator?.metric==='net_assets';
  const blockers = [
    !Number.isFinite(exposure) && 'Usable current contract fees and term dates are missing.',
    !(data.turnover?.status==='available' && Number.isFinite(data.turnover.value) && data.turnover.value>0) && (Number.isFinite(data.turnover?.value) && data.turnover.value>0 ? 'Annual turnover evidence is not valid for this comparison.' : 'A usable numeric annual turnover figure is missing.')
  ].filter(Boolean).join(' ');
  const position = available ? Math.min(100,Math.max(0,data.percentage)) : 0;
  const heat = !available ? 'unavailable' : data.percentage < 10 ? 'low' : data.percentage < 25 ? 'good' : data.percentage < 50 ? 'moderate' : data.percentage < 75 ? 'high' : 'critical';
  return <div className="space-y-3">
    <div className="ase-concentration" data-heat={heat} aria-label={`${historical ? 'Historical' : 'Current'} indicative commercial concentration${data.estimated ? ', estimated' : ''}${data.status==='incomplete' ? ', incomplete comparison' : ''}`}>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{proxy ? 'Commercial concentration · Balance-sheet proxy' : 'Commercial concentration · Contract exposure ÷ reported annual revenue'}</p>
      <p className="percentage">{available ? `${data.percentage.toFixed(1)}%` : 'Unavailable'}</p>
      <div className="track" role="img" aria-label={available ? `${data.percentage.toFixed(1)} percent of ${proxy ? netAssetsProxy ? 'balance-sheet net assets' : 'balance-sheet total assets' : 'reported turnover'}, shown on a 0 to 100 percent scale` : 'Concentration unavailable'}>
        {available && <><div className="fill" style={{width:`${position}%`}}/><span className="marker" style={{left:`${position}%`}}/></>}
      </div>
      <div className="amounts">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span aria-label={contractTotals ? 'Total contract exposure' : 'Historical annualised contract value'}>{exposure==null ? 'Unavailable' : formatCurrency(exposure)}</span>
          <span className="text-xs text-muted-foreground">{contractTotals ? 'Alliance contract exposure · Contract totals' : 'Historical annualised Alliance contract exposure'}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span aria-label={proxy ? 'Balance-sheet value' : 'Reported annual turnover'}>{Number.isFinite(data.comparison_denominator?.value ?? data.turnover?.value) ? formatCurrency(data.comparison_denominator?.value ?? data.turnover.value) : 'Unavailable'}</span>
          <span className="text-xs text-muted-foreground">{proxy ? netAssetsProxy ? 'Balance sheet · Net assets' : 'Balance sheet · Total assets' : 'Reported annual turnover'}</span>
        </div>
      </div>
      {contractTotals && <p className="mt-3 text-xs text-muted-foreground">Contract totals are not annualised or increased for shorter programmes. {available && <>{formatCurrency(exposure)} ÷ {formatCurrency(data.comparison_denominator?.value ?? data.turnover?.value)} × 100 = {data.percentage.toFixed(1)}%. </>}This compares contract exposure with {proxy ? 'balance-sheet value' : 'annual turnover'}, not annual Alliance revenue; periods may differ.</p>}
      {proxy && <p className="mt-3 text-xs text-muted-foreground">Turnover is unavailable under the filing exemption. Using balance-sheet total ({netAssetsProxy ? 'net assets: assets minus all liabilities' : 'total assets'}) of {formatCurrency(data.comparison_denominator.value)} at {data.comparison_denominator.period_end} instead. This is {netAssetsProxy ? 'a net-assets' : 'an asset-based'} exposure proxy, not revenue concentration; Low confidence and excluded from turnover-based Compass scoring.</p>}
      {!available && <p role="status" className="mt-3 text-xs text-muted-foreground">Cannot calculate concentration: {blockers || data.reason || 'Usable contract values and annual turnover evidence are required.'}</p>}
    </div>
    <ASECommercialEvidence data={data} expanded={expandedEvidence}/>
  </div>;
}