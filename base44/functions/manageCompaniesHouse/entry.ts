import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { internalRoles } from '../../shared/asePolicy.ts';
import { normaliseCompanyNumber,retrieveCompany,summariseCompany,sectionItems,publicOrigin } from '../../shared/companiesHouseData.ts';
import { companiesHouseEvidence } from '../../shared/companiesHouseEvidence.ts';
export default async function(req: Request): Promise<Response> {
  let client,attempt;
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user || !internalRoles.includes(user.role)) return Response.json({error:'Companies House refresh and audit data are internal-only.'},{status:403});
    const input=await req.json();
    if(!['read','refresh','records'].includes(input.action) || typeof input.accountId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.accountId)) return Response.json({error:'Valid Account and operation required.'},{status:400});
    const account=await base44.entities.Account.get(input.accountId);
    if(!account) return Response.json({error:'Account unavailable.'},{status:404});
    const number=normaliseCompanyNumber(account.company_number);
    const existing=account.ch_refresh_id ? await base44.entities.CompaniesHouseRefresh.get(account.ch_refresh_id) : null;
    const audit=existing?.account_id===account.id && existing.company_number===number ? existing : null;
    if(input.action==='read') {
      const recent=await base44.entities.CompaniesHouseRefresh.filter({account_id:account.id,company_number:number},{sort:'-refreshed_at',limit:1});
      return Response.json({audit,number,mismatch:!!existing && !audit,lastAttempt:recent.items[0] || null});
    }
    if(input.action==='records') {
      if(!audit?.raw_file_uri) return Response.json({error:'Refresh Companies House first.'},{status:400});
      const kinds=['officers','persons-with-significant-control','filing-history','charges','insolvency'];
      const offset=input.offset ?? 0;
      if(!kinds.includes(input.kind) || !Number.isInteger(offset) || offset<0 || offset>400) return Response.json({error:'Invalid source page.'},{status:400});
      const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:audit.raw_file_uri});
      const stored=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});
      if(!stored.ok) throw new Error('Stored audit snapshot is unavailable.');
      const raw=await stored.json(),items=sectionItems(raw,input.kind);
      return Response.json({items:items.slice(offset,offset+50),has_more:offset+50<items.length,next_offset:offset+50,collection:audit.summary.collections[input.kind]});
    }
    const latest=await base44.entities.CompaniesHouseRefresh.filter({account_id:account.id},{sort:'-refreshed_at',limit:1});
    if(latest.items[0] && Date.now()-Date.parse(latest.items[0].refreshed_at)<60000) return Response.json({error:'Please wait one minute between Companies House refreshes.'},{status:429});
    if(account.name.startsWith('ASE Demo')) return Response.json({error:'Fictional demo Accounts cannot be enriched from real registry data.'},{status:400});
    const key=secrets.get('COMPANIES_HOUSE_API_KEY');
    if(!key) return Response.json({error:'Companies House credentials have not been configured.'},{status:503});
    client=base44.asServiceRole;
    attempt=await client.entities.CompaniesHouseRefresh.create({account_id:account.id,company_number:number,requested_by:user.id,refreshed_at:new Date().toISOString(),status:'pending'});
    const raw=await retrieveCompany(number,key),text=JSON.stringify({source:'Companies House',company_number:number,refreshed_at:attempt.refreshed_at,...raw});
    const bytes=new TextEncoder().encode(text);
    if(bytes.length>10000000) throw new Error('Companies House audit snapshot exceeds the safe size limit.');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const {file_uri}=await client.integrations.Core.UploadPrivateFile({file:new File([bytes],`companies-house-${number}-${attempt.id}.json`,{type:'application/json'})});
    const saved={...attempt,raw_file_uri:file_uri,raw_sha256:hash};
    await client.entities.CompaniesHouseRefresh.update(attempt.id,{raw_file_uri:file_uri,raw_sha256:hash});
    if(raw.error) {await client.entities.CompaniesHouseRefresh.update(attempt.id,{raw_file_uri:file_uri,raw_sha256:hash,status:'failed',error:raw.error,warnings:raw.warnings});return Response.json({error:raw.error},{status:400});}
    const current=await base44.entities.Account.get(account.id);
    if(normaliseCompanyNumber(current.company_number)!==number) throw new Error('Company Number changed during refresh. No enrichment has been applied.');
    if(current.ch_last_refreshed && current.ch_last_refreshed>attempt.refreshed_at) throw new Error('A newer Companies House refresh has already been saved.');
    const summary=summariseCompany(raw),facts=companiesHouseEvidence(account,raw,saved);
    // Only retire mutable source inputs. Published assessment evidence is never rewritten.
    for(let batch=0;batch<10;batch++) {
      const retired=await client.entities.ASEEvidence.updateMany({account_id:account.id,assessment_id:null,source:'Companies House',score_eligible:{$ne:false}},{$set:{score_eligible:false}});
      if(!retired.has_more) break;
    }
    await client.entities.ASEEvidence.upsert(facts,{key:'external_key'});
    const root=`${publicOrigin}/company/${number}`;
    const patch={company_number:number,company_name:summary.company_name,company_status:summary.company_status,company_type:summary.company_type,company_registered_office:summary.registered_office,ch_links_self:root,ch_links_officers:root+'/officers',ch_links_filing_history:root+'/filing-history',ch_links_psc:root+'/persons-with-significant-control',ch_company_number:number,ch_refresh_id:attempt.id,ch_last_refreshed:attempt.refreshed_at,...(summary.date_of_creation ? {date_of_incorporation:summary.date_of_creation+'T00:00:00Z'} : {})};
    await client.entities.Account.update(account.id,patch);
    const completed=await client.entities.CompaniesHouseRefresh.update(attempt.id,{summary,raw_file_uri:file_uri,raw_sha256:hash,warnings:raw.warnings,status:raw.warnings.length ? 'partial' : 'completed'});
    return Response.json({audit:completed,accountPatch:patch,evidenceCount:facts.length});
  } catch(error) {
    const message=error.message || 'Companies House refresh failed.';
    if(client && attempt) await client.entities.CompaniesHouseRefresh.update(attempt.id,{status:'failed',error:message});
    return Response.json({error:message},{status:400});
  }
}