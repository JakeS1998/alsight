const roles={appointment_pm:'projectmanager',appointment_pd_cdm:'principaldesignercdm',appointment_architect:'architect',appointment_pd_br:'principaldesignerbuildingregulations'};
const normalise=value=>String(value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
const company=value=>String(value || '').trim().toUpperCase().padStart(8,'0');
export function pathwayAppointmentFee(delivery,proposal,account,documentType) {
  const role=roles[documentType];
  if(!role || !account.company_number) return null;
  let team;try {team=JSON.parse(delivery.delivery_team || '[]');}catch {return null;}
  if(!Array.isArray(team)) return null;
  const matches=team.filter(member=>company(member.supplier_company_number)===company(account.company_number) && normalise(member.role)===role);
  if(matches.length!==1) return null;
  const amounts=['riba_1','riba_2','riba_3','riba_4','riba_5_7'].map(stage=>Number(matches[0].fees?.[stage] || 0));
  if(amounts.some(value=>!Number.isFinite(value) || value<0)) return null;
  const value=Math.round(amounts.reduce((sum,amount)=>sum+amount,0)*100)/100;
  return value>0 && value<=1e12 ? {value,proposal_id:proposal.id,revision:proposal.revision_number,status:proposal.status,source:`Pathway fee proposal R${proposal.revision_number || 1}: company-and-role matched ${matches[0].role} supplier fees across RIBA stages, excluding VAT and Alliance fees. Current proposal estimate, not a verified signed appointment value.`} : null;
}