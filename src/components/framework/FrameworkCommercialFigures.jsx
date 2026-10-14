import React from 'react';
import {formatCurrency} from '@/lib/portal';
export default function FrameworkCommercialFigures({data}) {
 if(data.totalCallOffValue===undefined)return null;
 return <div className="mt-6 space-y-5 border-t border-border pt-6 lg:mt-3 lg:space-y-3 lg:pt-3">
  <div className="grid gap-5 sm:grid-cols-2">
   <div><p className="text-xs text-muted-foreground sm:text-sm">Total Call-Off Value</p><p className="mt-2 break-words text-3xl font-bold leading-tight tracking-tight tabular-nums lg:text-2xl">{formatCurrency(data.totalCallOffValue)}</p><p className="mt-2 text-xs text-muted-foreground">{data.callOffFinancialYear} · DMA/DPA executed 1 April–31 March. Same across-Alliance total as Alliance360, using submitted proposals or estimates.</p></div>
   <div><p className="text-xs text-muted-foreground sm:text-sm">Total UKLF Fees</p><p className="mt-2 break-words text-3xl font-bold leading-tight tracking-tight text-primary tabular-nums lg:text-2xl">{formatCurrency(data.totalUKLFFees)}</p><p className="mt-2 text-xs text-muted-foreground">DMA/DPA projects executed in the same financial year, using their framework fee bands; UKLF fees and contingency excluded from the fee base.</p>{data.uncalculatedFeeCount>0 && <p className="mt-2 text-xs text-destructive">{data.uncalculatedFeeCount} signed project(s) excluded from fee totals because their fee rules are unavailable.</p>}</div>
  </div>
  {data.totalPipelineValue!==undefined && <div className="border-t border-border pt-5 lg:pt-3">
   <p className="text-xs text-muted-foreground sm:text-sm">Total Pipeline Value</p><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums lg:text-2xl">{formatCurrency(data.totalPipelineValue)}</p>
   <p className="mt-2 text-xs text-muted-foreground">Framework projects without a signed DMA/DPA, excluding completed projects. Fee proposals, then overview estimates.</p>
   <div className="mt-4 grid grid-cols-2 gap-5 lg:mt-2 lg:gap-3">{[['FW3',data.fw3PipelineValue],['FW4',data.fw4PipelineValue]].map(([label,value])=><div key={label}><p className="text-xs text-muted-foreground">{label} Pipeline</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(value)}</p></div>)}</div>
  </div>}
 </div>;
}