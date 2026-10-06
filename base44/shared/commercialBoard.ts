export default async function commercialBoard(db,query,stageTotals,selectedStages,cursors={}) {
  const pages=[];
  for(const stage of selectedStages) {
    const populated=stageTotals.rows.some(row=>(row.stage || 'lead')===stage && row.count>0);
    if(!populated) {
      pages.push({stage,items:[],has_more:false,next_cursor:null});
      continue;
    }
    const stageQuery=stage==='lead' ? {...query,$and:[...(query.$and || []),{$or:[{stage:'lead'},{stage:{$exists:false}}]}]} : {...query,stage};
    const page=await db.Opportunity.filter(stageQuery,{sort:'expected_decision_date',limit:20,...(cursors[stage] ? {cursor:cursors[stage]} : {})});
    pages.push({stage,...page});
  }
  return pages;
}