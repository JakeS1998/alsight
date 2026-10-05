const stages=['riba_1','riba_2','riba_3','riba_4','riba_5_7'];
const numeric=value=>value==='' || value==null ? 0 : Number(value);
const number=value=>String(value || '').trim().toUpperCase().padStart(8,'0');
export function pathwayContractorFee(delivery,proposal,account) {
  let team;try {team=JSON.parse(delivery.delivery_team || '[]');} catch {return null;}
  if(!Array.isArray(team) || !account.company_number) return null;
  const contractors=team.filter(member=>String(member.role || '').trim().toLowerCase()==='contractor');
  const bases=member=>{
    const result=Object.fromEntries(stages.map(stage=>[stage,0]));
    if(Array.isArray(member.contractor_fees)) for(const fee of member.contractor_fees) {
      const stage=fee.type==='authorised_activity' ? 'riba_5_7' : fee.stage;
      if(stage in result) result[stage]+=numeric(fee.amount);
    } else for(const stage of stages) result[stage]=numeric(member.fees?.[stage]);
    return result;
  };
  const rows=contractors.map(member=>({member,base:bases(member),ohp:member.contractor_ohp || {}}));
  const legacy=rows.filter(row=>row.member.contractor_ohp===null);
  for(const row of legacy) row.ohp=Object.fromEntries(stages.map(stage=>[stage,{type:stage!=='riba_5_7' && proposal.ohp_surveys_type==='fixed' ? 'fixed' : 'percentage',value:stage==='riba_5_7' ? numeric(proposal.ohp_riba57_pct) : numeric(proposal.ohp_surveys_pct)}]));
  if(proposal.ohp_surveys_type==='fixed' && legacy.length) {
    const cells=legacy.flatMap(row=>stages.slice(0,4).map(stage=>({row,stage,base:row.base[stage]})));
    const total=cells.reduce((sum,cell)=>sum+cell.base,0),last=[...cells].reverse().find(cell=>cell.base>0) || cells[0],cents=Math.round(numeric(proposal.ohp_surveys_fixed)*100);let allocated=0;
    for(const cell of cells) if(cell!==last) {const share=total ? Math.round(cents*cell.base/total) : 0;allocated+=share;cell.row.ohp[cell.stage]={type:'fixed',value:share/100};}
    last.row.ohp[last.stage]={type:'fixed',value:(cents-allocated)/100};
  }
  const matches=rows.filter(row=>number(row.member.supplier_company_number)===number(account.company_number));
  if(matches.length!==1) return null;
  const row=matches[0];let total=0;
  for(const stage of stages) {
    const setting=row.ohp[stage],base=row.base[stage];
    if(!Number.isFinite(base) || base<0) return null;
    const ohp=setting?.type==='fixed' ? Math.round(numeric(setting.value)*100)/100 : Math.round(base*numeric(setting?.value)*100/100)/100;
    if(!Number.isFinite(ohp) || ohp<0) return null;
    total+=base+ohp;
  }
  const value=Math.round(total*100)/100;
  return value>0 && value<=1e12 ? {value,proposal_id:proposal.id,revision:proposal.revision_number,status:proposal.status,source:`Pathway fee proposal R${proposal.revision_number || 1}: this company's contractor build-up including OHP, excluding VAT, ALS and other direct suppliers' fees. Proposal value, not verified signed-contract income.`} : null;
}