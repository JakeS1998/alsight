export function frameworkProjectNumber(value) {
 const match=/^(?:(?:PROJ|FW[34])\s*)?(\d+)[a-z]?$/i.exec(String(value || '').trim());
 return match ? `PROJ${Number(match[1])}` : null;
}
export function frameworkCommercialVersion(projectNumber,reference) {
 const explicit=/^FW([34])/i.exec(String(reference || '').trim());
 if(explicit)return `FW${explicit[1]}`;
 const number=frameworkProjectNumber(projectNumber || reference);
 return number ? (Number(number.slice(4))<1000 ? 'FW3' : 'FW4') : null;
}
export function frameworkProposalValues(proposal,settings) {
 if(!proposal)return null;
 const lines=JSON.parse(proposal.line_items || '[]');
 if(!Array.isArray(lines))throw new Error('Fee proposal lines must be an array.');
 const amount=line=>Math.round(Object.values(line.stage_fees && typeof line.stage_fees==='object' ? line.stage_fees : {fee:line.internal_fee}).reduce((total,value)=>total+(Number(value) || 0),0)*100)/100;
 const supplier=Math.max(0,Number(proposal.external_cost) || 0);
 const value=supplier+lines.filter(line=>line.include_on_client!==false).reduce((total,line)=>total+amount(line),0);
 const excluded=line=>/uklf|contingency/i.test(line.description || '') || [settings.uklf,settings.contingency].some(label=>String(line.description || '').trim().toLowerCase()===label.toLowerCase());
 const feeBase=Math.max(0,supplier+lines.filter(line=>!excluded(line)).reduce((total,line)=>total+amount(line),0));
 return value>0 ? {value,feeBase,source:'proposal'} : null;
}