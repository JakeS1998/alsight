import {pathwayContractorFee} from './asePathwayFee.ts';
export async function contractorDMAFallbackNeeded(base44,project) {
 const db=base44.entities,refs=[project.id,project.dataverse_id].filter(Boolean);
 const proposals=await db.FeeProposal.filter({project_id:{$in:refs},is_current:true,status:{$ne:'lost'}},{limit:2});
 if(!proposals.items.length)return true;
 const [contracts,delivery]=await Promise.all([
  db.JCT.filter({project_id:{$in:refs},executed:'yes'},{limit:80,fields:['contractor_id','account_id','client_account_id']}),
  db.ProjectDelivery.filter({project_id:{$in:refs}},{limit:2,fields:['delivery_team']})
 ]);
 if(contracts.has_more)throw new Error('Too many executed contractor records to safely check DMA fallback.');
 if(!contracts.items.length)return false;
 if(proposals.items.length!==1||proposals.has_more||delivery.items.length!==1||delivery.has_more)return true;
 const ids=[...new Set(contracts.items.map(c=>c.contractor_id || (c.account_id!==c.client_account_id?c.account_id:null)).filter(Boolean))];
 const accounts=ids.length?await db.Account.filter({$or:[{id:{$in:ids}},{dataverse_id:{$in:ids}}]},{limit:80,fields:['dataverse_id','company_number']}):{items:[]};
 if(accounts.has_more)throw new Error('Too many contractor accounts to safely check DMA fallback.');
 return contracts.items.some(c=>{
  const id=c.contractor_id || (c.account_id!==c.client_account_id?c.account_id:null),matches=accounts.items.filter(a=>[a.id,a.dataverse_id].filter(Boolean).includes(id));
  return matches.length!==1 || !pathwayContractorFee(delivery.items[0],proposals.items[0],matches[0]);
 });
}