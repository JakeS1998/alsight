import {commercialTurnover} from './aseCommercialTurnover.ts';
import {collectASESource} from './aseCollectSource.ts';
import {withASEAutomationLease} from './aseAutomationLease.ts';
import {sourceIdentifier} from './aseSourceCommon.ts';
import {internalRoles} from './asePolicy.ts';

export async function ensureCommercialAccounts(client,account,user,now) {
  if(!user?.id || !internalRoles.includes(user.role)) return {turnover:await commercialTurnover(client,account,now)};
  // The caller authenticates and reads this account with the user's permissions first.
  // Elevation is limited to this company's filed-account snapshot and source collection.
  const service=client.asServiceRole;
  const base44={entities:service.entities,integrations:service.integrations,asServiceRole:service};
  let turnover=await commercialTurnover(base44,account,now);
  if(turnover.status==='available' || turnover.balance_sheet_proxy?.status==='available' || account.name?.startsWith('ASE Demo')) return {turnover};
  try {
    const identifier=sourceIdentifier(account,'accounts');
    const query={account_id:account.id,source_key:'accounts',identifier};
    const recentCheck=async()=>{
      const page=await base44.entities.ASESourceRefresh.filter(query,{sort:'-refreshed_at',limit:1});
      return page.items[0] && now.getTime()-Date.parse(page.items[0].refreshed_at)<86400000 ? page.items[0] : null;
    };
    const recent=await recentCheck();
    if(recent) return {turnover,notice:{status:recent.status,checked_at:recent.refreshed_at,message:recent.status==='failed' ? `Latest filed accounts could not be fetched: ${recent.error || 'source unavailable'}. Automatic retry is available after 24 hours.` : recent.status==='pending' ? 'Latest filed accounts are being retrieved.' : 'Latest filings checked within the past 24 hours; no usable reported turnover or positive net-assets figure was available.'}};
    const result=await withASEAutomationLease(base44,async assertLease=>{
      if(await recentCheck()) return {skipped:true};
      const collected=await collectASESource(base44,account,'accounts',user);
      await assertLease();
      return collected;
    },`account:${account.id}`);
    if(result.busy) return {turnover,notice:{status:'pending',message:'An organisation update is already running; latest accounts will be checked when it finishes.'}};
    turnover=await commercialTurnover(base44,account,new Date());
    const available=turnover.status==='available' || turnover.balance_sheet_proxy?.status==='available';
    return {turnover,notice:{status:available ? 'available' : 'unavailable',checked_at:result.audit?.refreshed_at,message:available ? 'Latest Companies House filings checked; reported figures retrieved.' : 'Latest Companies House filings checked, but no usable reported turnover or positive net-assets figure could be extracted. Missing figures are not estimated.'}};
  } catch(error) {
    return {turnover,notice:{status:'failed',message:`Latest filed accounts could not be fetched: ${String(error.message).slice(0,300)}`}};
  }
}