import {supplierRegistryQuery,registryLinkageQuery} from './supplierRegistryScope.ts';
import {withASEAutomationLease} from './aseAutomationLease.ts';
import {collectASESource} from './aseCollectSource.ts';
import {corporatePSCTree} from './aseCorporatePSCTree.ts';
import {corporatePSCClient} from './aseCorporatePSCSource.ts';
import {indexCorporatePSCs} from './corporatePSCIndex.ts';
import {normaliseCompanyNumber} from './companiesHouseData.ts';
export async function supplierRegistryRun(base44,user,input) {
  const db=base44.entities;
  return withASEAutomationLease(base44,async()=>{
    if(input.action==='start') {
      const existing=await db.SupplierRegistryRun.filter({status:'running'},{limit:1});
      if(existing.items.length) return {run:existing.items[0],already_running:true};
      const count=await db.Account.count(supplierRegistryQuery);
      return {run:await db.SupplierRegistryRun.create({status:count ? 'running' : 'completed',phase:'registry',eligible_count:count,processed_count:0,failed_count:0,cursor:'',account_id:'',finished_listing:false,requested_by:user.id,dispatch_token:crypto.randomUUID(),errors:[],last_activity:new Date().toISOString()})};
    }
    const run=await db.SupplierRegistryRun.get(input.runId);
    if(!run || run.status!=='running' || run.dispatch_token!==input.token) return {skipped:true};
    const patch={last_activity:new Date().toISOString(),dispatch_token:crypto.randomUUID(),retry_count:0};
    let account;
    try {
      if(run.phase==='linkage') {
        const page=await db.Account.filter(registryLinkageQuery,{sort:'id',limit:1,...(run.cursor ? {cursor:run.cursor} : {})});account=page.items[0];
        if(account) {
          const number=normaliseCompanyNumber(account.company_number),stored=await db.CorporatePSCSnapshot.filter({account_id:account.id,company_number:number,checked_at:{$gte:new Date(Date.now()-7*86400000).toISOString()},register_complete:true},{limit:1});
          if(!stored.items.length){const client=await corporatePSCClient();await indexCorporatePSCs(base44,account,await client.psc(number));}
        }
        Object.assign(patch,{cursor:page.next_cursor || '',...(!page.has_more ? {status:'completed',completed_at:new Date().toISOString()} : {})});
      } else {
        if(run.account_id) account=await db.Account.get(run.account_id);
        else {
          const page=await db.Account.filter(supplierRegistryQuery,{sort:'id',limit:1,...(run.cursor ? {cursor:run.cursor} : {})});account=page.items[0];
          Object.assign(run,{account_id:account?.id || '',next_cursor:page.next_cursor || '',finished_listing:!page.has_more});
        }
        if(!account) Object.assign(patch,{phase:'linkage',cursor:'',account_id:''});
        else {
          normaliseCompanyNumber(account.company_number);
          await withSupplierAccount(base44,account,run,user);
          Object.assign(patch,nextSupplierStage(run));
        }
      }
    } catch(error) {
      if((Number(error.status || error.response?.status)===429 || /429|rate limit|too many|already running|Please wait/i.test(error.message)) && (run.retry_count || 0)<3) {
        Object.assign(patch,{account_id:run.account_id || '',next_cursor:run.next_cursor || '',finished_listing:!!run.finished_listing,retry_count:(run.retry_count || 0)+1});
        await db.SupplierRegistryRun.update(run.id,patch);return {retry:true};
      }
      patch.failed_count=(run.failed_count || 0)+1;
      patch.errors=[...(run.errors || []),{account_id:account?.id || '',name:account?.name || '',phase:run.phase,message:String(error.message).slice(0,600)}].slice(-40);
      if(run.phase==='linkage') {
        const page=await db.Account.filter(registryLinkageQuery,{sort:'id',limit:1,...(run.cursor ? {cursor:run.cursor} : {})});Object.assign(patch,{cursor:page.next_cursor || '',...(!page.has_more ? {status:'completed',completed_at:new Date().toISOString()} : {})});
      } else Object.assign(patch,nextSupplierStage(run));
    }
    return {run:await db.SupplierRegistryRun.update(run.id,patch)};
  },'supplier-registry-run');
}
function nextSupplierStage(run) {
  if(run.phase==='registry' || run.phase==='accounts') return {phase:run.phase==='registry' ? 'accounts' : 'structure',account_id:run.account_id,next_cursor:run.next_cursor,finished_listing:run.finished_listing};
  return {processed_count:(run.processed_count || 0)+1,account_id:'',cursor:run.finished_listing ? '' : run.next_cursor,phase:run.finished_listing ? 'linkage' : 'registry',finished_listing:false,next_cursor:''};
}
async function withSupplierAccount(base44,account,run,user) {
  const result=await withASEAutomationLease(base44,async()=>{
    if(run.phase==='registry') {
      const r=await base44.functions.invoke('manageCompaniesHouse',{action:'refresh',accountId:account.id});
      if(r.data.error){const e=new Error(r.data.error);e.status=r.status;throw e;}
    } else if(run.phase==='accounts') await collectASESource(base44,account,'accounts',user);
    else {
      const tree=await corporatePSCTree(base44,account),client=await corporatePSCClient(),register=await client.psc(normaliseCompanyNumber(account.company_number));
      await indexCorporatePSCs(base44,account,register,tree);
    }
  },`account:${account.id}`);
  if(result?.busy){const e=new Error('An update for this organisation is already running.');e.status=429;throw e;}
}