export const commercialBoardGroups = [
  {stage:'lead',label:'Lead / Qualified',stages:['lead','qualified']},
  {stage:'scope_development',label:'Scope / Design',stages:['scope_development','design_feasibility']},
  {stage:'proposal_preparation',label:'Proposals',stages:['proposal_preparation','proposal_submitted']},
  {stage:'negotiation',label:'Negotiation / Preferred Partner',stages:['negotiation','preferred_partner']},
  {stage:'on_hold',label:'On Hold',stages:['on_hold']}
];
export async function groupedCommercialBoard(db,query,stageTotals,selectedGroups,cursors={}) {
  const pages=[];
  for(const group of commercialBoardGroups.filter(g=>!selectedGroups || selectedGroups.includes(g.stage))) {
    const applicable=query.stage ? group.stages.filter(stage=>stage===query.stage) : group.stages;
    const rows=stageTotals.rows.filter(row=>applicable.includes(row.stage || 'lead'));
    const total=rows.reduce((sum,row)=>({count:sum.count+row.count,sum_budget:sum.sum_budget+(row.sum_budget || 0),sum_weighted_value:sum.sum_weighted_value+(row.sum_weighted_value || 0)}),{count:0,sum_budget:0,sum_weighted_value:0});
    if(!total.count) {pages.push({...group,total,items:[],has_more:false,next_cursor:null});continue;}
    const stageQuery={...query,stage:{$in:applicable.includes('lead') ? [...applicable,null] : applicable}};
    const page=await db.Opportunity.filter(stageQuery,{sort:'expected_decision_date',limit:20,...(cursors[group.stage] ? {cursor:cursors[group.stage]} : {})});
    pages.push({...group,total,...page});
  }
  return pages;
}