import { secrets } from 'base44:runtime';
import { sourceFetch,makeSourceFact } from './aseSourceCommon.ts';
export async function retrieveHmrc(account,vat,refresh,requester='') {
  if(requester && !/^(?:\d{9}|\d{12})$/.test(requester)) throw new Error('Your organisation’s VAT number must contain 9 or 12 digits.');
  const clientId=secrets.get('HMRC_CLIENT_ID'),clientSecret=secrets.get('HMRC_CLIENT_SECRET');
  if(!clientId || !clientSecret) throw new Error('HMRC production credentials are missing.');
  const tokenResponse=await sourceFetch('https://api.service.hmrc.gov.uk/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'client_credentials',scope:'read:vat'})},64000);
  if(!tokenResponse.ok) throw new Error(`HMRC production authorisation failed (HTTP ${tokenResponse.status}). Check production credentials and Check a UK VAT Number v2 access. No verification was recorded.`);
  const token=JSON.parse(tokenResponse.text).access_token;
  if(typeof token!=='string' || !token) throw new Error('HMRC did not issue an access token.');
  const url=`https://api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup/${vat}${requester ? '/'+requester : ''}`;
  const response=await sourceFetch(url,{headers:{Accept:'application/vnd.hmrc.2.0+json',Authorization:`Bearer ${token}`}},128000);
  const raw=JSON.parse(response.text);
  const notFound=response.status===404 && raw.code==='NOT_FOUND';
  if(!response.ok && !notFound) throw new Error(`HMRC VAT check unavailable (HTTP ${response.status}); registration status remains unknown.`);
  if(response.ok && String(raw.target?.vatNumber)!==vat) throw new Error('HMRC VAT identifier did not match the requested VAT number.');
  const today=refresh.refreshed_at.slice(0,10),normalise=name=>String(name || '').toLowerCase().replace(/[^a-z0-9]/g,''),identityMatched=response.ok && [account.name,account.company_name].some(name=>normalise(name) && normalise(name)===normalise(raw.target?.name));
  const notes=notFound ? 'HMRC returned NOT_FOUND for this VAT number. This is not evidence of insolvency and must not lower ASE automatically.' : `Registered name: ${raw.target.name}. ${identityMatched ? 'Normalised name matches this Account.' : 'Name does not exactly match this Account; verify group registration and identity manually.'} ${raw.consultationNumber ? 'HMRC consultation reference: '+raw.consultationNumber+'.' : 'Simple live lookup; no HMRC consultation reference. Enter your organisation’s VAT number for a referenced check.'}`;
  const facts=[makeSourceFact(account,'hmrc',vat,refresh,'vat-check',{component:'vat_verification',title:'Live HMRC VAT registration check',value:notFound ? 'VAT number not found' : `Registered · ${raw.target.name}`,source_reference:url,evidence_type:'compliance',source_date:today,notes,confidence:'High',severity:notFound || !identityMatched ? 'minor' : 'none'})];
  return {facts,raw,summary:{vat_number:vat,registered:response.ok,registered_name:raw.target?.name || null,identity_matched:identityMatched,address:raw.target?.address || null,consultation_reference:raw.consultationNumber || null,environment:'production',processing_date:raw.processingDate || refresh.refreshed_at},warnings:!identityMatched && response.ok ? ['VAT registration exists, but Account identity requires manual confirmation.'] : []};
}