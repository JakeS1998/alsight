import {corporatePSCTree} from './aseCorporatePSCTree.ts';
import {scopedReadCache} from './scopedReadCache.ts';
export async function groupStructure(base44,account) {
  const user=await base44.auth.me();
  return scopedReadCache(JSON.stringify(['corporate-psc-v2',user.id,user.role,account.id,account.company_number]),()=>corporatePSCTree(base44,account));
}