import React from 'react';
import {formatCurrency} from '@/lib/portal';
export default function FinanceForecastCurrentBar({actual,forecast,type,height}){
 if(actual==null||forecast==null)return <div className="finance-chart-unavailable">Unavailable</div>;
 const total=actual+forecast;
 if(total===0)return <div className="w-[54px] border-b-2 border-als-navy pb-1 text-center text-xs font-semibold">£0</div>;
 return <div className="finance-current-stack" style={{height:height(total)}} title={`${type}: actual ${formatCurrency(actual)} + forecast ${formatCurrency(forecast)}`}><div className={type==='Invoices'?'finance-current-segment finance-chart-estimate':'finance-current-segment finance-po-estimate'} style={{flex:forecast}}/><div className={type==='Invoices'?'finance-current-segment bg-primary':'finance-current-segment bg-als-navy'} style={{flex:actual}}/></div>;
}