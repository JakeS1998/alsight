const number=value=>value==null || value==='' || isNaN(Number(value)) ? null : Number(value);
export default function projectASERatingBuckets(projects,reports,today) {
 const buckets={attention:[],clear:[],unassessed:[]};
 const [delivery,deliveryDates,decisions,risks,legal,dma,jct,warranties,actions,valuations]=reports;
 const byProject=rows=>{const map=new Map();for(const row of rows){const group=map.get(row.project_id)||[];group.push(row);map.set(row.project_id,group);}return map;};
 const deliveries=byProject(delivery.rows),deliveryDateMap=byProject(deliveryDates.rows),decisionMap=byProject(decisions.rows),riskMap=byProject(risks.rows),legalSets=[legal,dma,jct].map(r=>Object.fromEntries(Object.entries(r).map(([key,page])=>[key,new Set(page.items)]))),outstandingSet=new Set(warranties.outstanding.items),warrantyDueSet=new Set(warranties.due.items),lateActions=new Set(actions.items),lateValuations=new Set(valuations.items);
 for(const project of projects) {
  const d={...(deliveries.get(project.id)?.[0] || {}),...(deliveryDateMap.get(project.id)?.[0] || {})},key=project.id,keys=[key,project.dataverse_id].filter(Boolean);
  const ds=decisionMap.get(key)||[],rs=riskMap.get(key)||[];
  const approved=ds.find(r=>r.status==='agreed')?.sum_financial_adjustment || 0,pending=ds.find(r=>r.status==='open')?.sum_financial_adjustment || 0;
  const open=rs.filter(r=>r.status==='open'),allowance=open.reduce((sum,r)=>sum+(r.sum_weighted_cost || 0),0);
  const original=Date.parse(d.original_pc),forecast=Date.parse(d.forecast_pc),programmeKnown=Number.isFinite(original)&&Number.isFinite(forecast),programmeLate=programmeKnown&&Math.round((forecast-original)/86400000)>0;
  const contract=number(d.contract_sum),current=contract==null ? null : contract+approved;
  const commercialFlag=contract!=null && (lateValuations.has(key) || current+pending+allowance>current || pending>0 || contract>0 && approved>contract*0.10);
  let legalTotal=0,legalPending=0,legalDue=0,outstanding=0,warrantyDue=0;
  for(const sets of legalSets)for(const id of keys){legalTotal+=Number(sets.total.has(id));legalPending+=Number(sets.incomplete.has(id));legalDue+=Number(sets.due.has(id));}
  for(const id of keys){outstanding+=Number(outstandingSet.has(id));warrantyDue+=Number(warrantyDueSet.has(id));}
  const started=d.contract_start && d.contract_start.slice(0,10)<=today,completed=[d.pc_achieved,project.practical_completion_date].some(date=>date && date.slice(0,10)<=today);
  const attention=programmeLate || commercialFlag || open.length>0 || legalPending>0 && (legalDue>0 || started) || outstanding>0 && (warrantyDue>0 || completed) || lateActions.has(key);
  const healthy=programmeKnown && !programmeLate || contract!=null && !commercialFlag || legalTotal>0 && !legalPending || rs.length>0 && !open.length;
  buckets[attention ? 'attention' : healthy ? 'clear' : 'unassessed'].push(key);
 }
 return buckets;
}