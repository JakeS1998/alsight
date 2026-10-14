import React from 'react';
import {formatCurrency} from '@/lib/portal';
export default function FrameworkCommercialFigures({data}) {
 if(data.totalCallOffValue===undefined)return null;
 return <div className="mt-6 space-y-5 border-t border-border pt-6">
  <div className="grid gap-5 sm:grid-cols-2">
   <div><p className="text-xs text-muted-foreground sm:text-sm">Total Call-Off Value</p><p className="mt-2 break-words text-3xl font-bold leading-tight tracking-tight tabular-nums 2xl:text-4xl">{formatCurrency(data.totalCallOffValue)}</p><p className="mt-2 text-xs text-muted-foreground">Signed DMA/DPA projects only. Fee proposals, then overview estimates.</p></div>
   <div><p className="text-xs text-muted-foreground sm:text-sm">Total UKLF Fees</p><p className="mt-2 break-words text-3xl font-bold leading-tight tracking-tight text-primary tabular-nums 2xl:text-4xl">{formatCurrency(data.totalUKLFFees)}</p><p className="mt-2 text-xs text-muted-foreground">Same signed DMA/DPA projects, using their framework fee bands; UKLF fees and contingency excluded from the fee base.</p>{data.uncalculatedFeeCount>0 && <p className="mt-2 text-xs text-destructive">{data.uncalculatedFeeCount} signed project(s) excluded from fee totals because their fee rules are unavailable.</p>}</div>
  </div>
  {data.totalPipelineValue!==undefined && <div className="border-t border-border pt-5">
   <p className="text-xs text-muted-foreground sm:text-sm">Total Pipeline Value</p><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(data.totalPipelineValue)}</p>
   <p className="mt-2 text-xs text-muted-foreground">Framework projects without a signed DMA/DPA, excluding completed projects. Fee proposals, then overview estimates.</p>
   <div className="mt-4 grid grid-cols-2 gap-5">{[['FW3',data.fw3PipelineValue],['FW4',data.fw4PipelineValue]].map(([label,value])=><div key={label}><p className="text-xs text-muted-foreground">{label} Pipeline</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(value)}</p></div>)}</div>
  </div>}
 </div>;
}