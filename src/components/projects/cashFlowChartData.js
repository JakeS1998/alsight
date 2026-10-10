export default function cashFlowChartData(entries, forecast) {
 const byDate = new Map();
 entries.forEach(({date,type,amount}) => {
  if (!date || !['received','spent'].includes(type)) return;
  date=date.slice(0,10);
  const row=byDate.get(date)||{date,received:0,spent:0};
  row[type]+=Number(amount)||0;
  byDate.set(date,row);
 });
 let received=0,spent=0;
 const actual=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(row=>{
  received+=row.received;spent+=row.spent;
  return {date:row.date,received,spent,balance:received-spent};
 });
 if (!forecast?.available || !(forecast.remaining > 0)) return actual;
 const points=new Map(actual.map(row=>[row.date,row]));
 const baseline=[...actual].reverse().find(row=>row.date<=forecast.today);
 let predicted=baseline?.spent||0;
 points.set(forecast.today,{...(points.get(forecast.today)||{date:forecast.today,...(baseline?{received:baseline.received,spent:baseline.spent,balance:baseline.balance}:{})}),poForecast:predicted});
 for (const row of forecast.rows) {
  predicted+=row.amount;
  points.set(row.date,{...(points.get(row.date)||{date:row.date}),poForecast:predicted});
 }
 return [...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
}