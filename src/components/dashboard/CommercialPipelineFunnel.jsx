import React from 'react';
import {formatCurrency} from '@/lib/portal';

export default function CommercialPipelineFunnel({rows,labels}) {
  const taper=192 / Math.max(rows.length,1);
  return <ol aria-label="Commercial pipeline by stage" className="mx-auto mt-4 w-full max-w-xl space-y-0.5">
    {rows.map((row,index)=>{
      const top=index*taper/2,bottom=(index+1)*taper/2;
      return <li key={row.stage} className="grid min-h-12 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-stretch gap-4">
        <svg aria-hidden="true" viewBox="0 0 320 48" preserveAspectRatio="none" className="h-full min-h-12 w-full text-primary">
          <polygon points={`${top},0 ${320-top},0 ${320-bottom},48 ${bottom},48`} fill="currentColor" opacity={1-index*.07}/>
        </svg>
        <div className="flex min-w-0 flex-col justify-center py-1">
          <strong className="text-xs font-semibold tabular-nums sm:text-sm">{formatCurrency(row.sum_budget)}</strong>
          <span className="mt-0.5 text-xs leading-snug text-muted-foreground">{labels[row.stage]} ({row.count})</span>
        </div>
      </li>;
    })}
  </ol>;
}