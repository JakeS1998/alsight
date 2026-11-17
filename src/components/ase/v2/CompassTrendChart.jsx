import React from 'react';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip} from 'recharts';
import {compassNumber,compassDate} from '@/components/ase/v2/compassDetailFormat';
export default function CompassTrendChart({chart}) {
  const points=chart?.points || [],available=points.filter(point=>Number.isFinite(point.value));
  if(available.length<2)return <p className="mt-3 text-xs text-muted-foreground">{available.length?'Only one comparable recorded point is available; a trend cannot yet be shown.':'No comparable dated numeric evidence is available for a trend graph.'}</p>;
  return <figure className="mt-4 min-w-0 space-y-2"><figcaption className="font-semibold">{chart.title}</figcaption>
    <div className="h-52 w-full min-w-0" role="img" aria-label={`${chart.title}: ${available.map(p=>`${compassDate(p.date)}, ${compassNumber(p.value,chart.unit)}`).join('; ')}`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{top:10,right:12,left:8,bottom:8}}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={compassDate} tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} minTickGap={40}/><YAxis width={70} domain={chart.unit==='score'?[1,5]:[0,'auto']} tickFormatter={value=>compassNumber(value,chart.unit,true)} tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}}/><Tooltip labelFormatter={compassDate} formatter={value=>[compassNumber(value,chart.unit),chart.title]} contentStyle={{background:'hsl(var(--card))',borderColor:'hsl(var(--border))',color:'hsl(var(--foreground))'}}/><Line type="linear" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r:4}} connectNulls={false} isAnimationActive={false}/></LineChart></ResponsiveContainer>
    </div><p className="text-xs text-muted-foreground">{chart.unit==='score'?'Published assessment scores, not the underlying financial amounts. Historical scores may reflect different saved methodology or evidence coverage.':'Reported comparable periods only; no forecasts or interpolated missing values.'}</p>
  </figure>;
}