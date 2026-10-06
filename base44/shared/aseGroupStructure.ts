import {corporatePSCTree} from './aseCorporatePSCTree.ts';
import {scopedReadCache} from './scopedReadCache.ts';
import {corporatePSCClient} from './aseCorporatePSCSource.ts';
import {normaliseCompanyNumber} from './companiesHouseData.ts';
import {indexCorporatePSCs,sharedPSCCorporations} from './corporatePSCIndex.ts';
export async function groupStructure(base44,account) {
  const user=await base44.auth.me();
  return scopedReadCache(JSON.stringify(['corporate-psc-v3',user.id,user.role,account.id,account.company_number]),async()=>{
    let number;try{number=normaliseCompanyNumber(account.company_number);}catch{return corporatePSCTree(base44,account);}
    const page=await base44.entities.CorporatePSCSnapshot.filter({account_id:account.id,company_number:number,checked_at:{$gte:new Date(Date.now()-7*86400000).toISOString()}},{limit:1});
    let snapshot=page.items[0],tree=snapshot?.structure || await corporatePSCTree(base44,account);
    if(!snapshot?.structure && user.role==='admin') {
      const client=await corporatePSCClient(),register=await client.psc(number);
      const indexed=await indexCorporatePSCs(base44,account,register,tree);snapshot={...indexed,company_number:number};
    }
    return {...tree,shared_corporations:await sharedPSCCorporations(base44,account,snapshot)};
  });
}