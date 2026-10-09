export async function projectOrderCashFlow(db, base, query) {
 const total = await db.FinanceDataverseRecord.count(query);
 const outgoing = {...query, $or: [{approved:true},{sent:true}]};
 const headers = await db.FinanceDataverseRecord.aggregate({query:outgoing,groupBy:['source_id','date','has_amount'],sum:'amount',limit:1000});
 if(headers.truncated)throw new Error('Purchase-order history exceeds the graph reporting limit.');
 const missingIds = headers.rows.filter(row=>!row.has_amount).map(row=>row.source_id);
 const lines = missingIds.length ? await db.FinanceDataverseRecord.aggregate({query:{...base,kind:'line_items',parent_id:{$in:missingIds}},groupBy:['parent_id','has_amount'],sum:'amount',limit:1000}) : {rows:[]};
 if(lines.truncated)throw new Error('Purchase-order line totals exceed the graph reporting limit.');
 const totals = new Map(), incomplete = new Set();
 for(const row of lines.rows){if(row.has_amount)totals.set(row.parent_id,row.sum_amount);else incomplete.add(row.parent_id);}
 const entries=[];let missingDates=0,missingValues=0;
 for(const row of headers.rows){
  const amount=row.has_amount?row.sum_amount:incomplete.has(row.source_id)?null:totals.get(row.source_id);
  if(!row.date||!Number.isFinite(Date.parse(row.date))){missingDates+=row.count;continue;}
  if(amount==null||!Number.isFinite(amount)){missingValues+=row.count;continue;}
  entries.push({date:row.date,amount,type:'spent'});
 }
 return {entries,total,missingDates,missingValues,available:true};
}