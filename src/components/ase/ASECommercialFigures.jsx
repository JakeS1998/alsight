import React from 'react';
import { formatCurrency } from '@/lib/portal';
import ASECommercialRevenue from '@/components/ase/ASECommercialRevenue';
import ASECommercialEvidence from '@/components/ase/ASECommercialEvidence';
import '@/components/ase/ase-commercial-figures.css';

export default function ASECommercialFigures({data,historical=false,expandedEvidence=false}) {
  const available = Number.isFinite(data.percentage);
  const position = available ? Math.min(100,Math.max(0,data.percentage)) : 0;
  const heat = !available ? 'unavailable' : data.percentage < 10 ? 'low' : data.percentage < 25 ? 'good' : data.percentage < 50 ? 'moderate' : data.percentage < 75 ? 'high' : 'critical';
  return <div className="space-y-3">
    <ASECommercialRevenue turnover={data.turnover} historical={historical}/>
    <div className="ase-concentration" data-heat={heat} aria-label={`${historical ? 'Historical' : 'Current'} indicative commercial concentration${data.estimated ? ', estimated' : ''}${data.status==='incomplete' ? ', incomplete comparison' : ''}`}>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">Commercial concentration · Contract exposure ÷ reported annual revenue</p>
      <p className="percentage">{available ? `${data.percentage.toFixed(1)}%` : 'Unavailable'}</p>
      <div className="track" role="img" aria-label={available ? `${data.percentage.toFixed(1)} percent of reported turnover, shown on a 0 to 100 percent scale` : 'Concentration unavailable'}>
        {available && <><div className="fill" style={{width:`${position}%`}}/><span className="marker" style={{left:`${position}%`}}/></>}
      </div>
      <div className="amounts">
        <span aria-label="Annualised contract value">{data.annualised_value==null ? 'Unavailable' : formatCurrency(data.annualised_value)}</span>
        <span className="text-xs">Annualised Alliance contract exposure</span>
      </div>
    </div>
    {!available && <div role="status" className="rounded-md bg-muted p-3 text-xs"><p className="font-semibold">Concentration cannot be calculated yet</p><p className="mt-1 text-muted-foreground">{data.reason || 'Usable contract values and verified annual turnover are required; missing evidence is not zero concentration.'}</p></div>}
    <ASECommercialEvidence data={data} expanded={expandedEvidence}/>
  </div>;
}