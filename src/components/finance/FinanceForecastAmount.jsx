import React from 'react';
import {formatCurrency} from '@/lib/portal';
const money=value=>value==null?'Unavailable':formatCurrency(value);
export default function FinanceForecastAmount({total,actual,forecast}){
 return <div className="tabular-nums"><span>{money(total)}</span><div className="mt-1 text-xs text-muted-foreground">Actual: {money(actual)}<br/>Forecast: {money(forecast)}</div></div>;
}