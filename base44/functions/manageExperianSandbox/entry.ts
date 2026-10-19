import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

let tokenCache, reportCache, lastAttempt;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({error:'Sign in to access the Experian sandbox.'},{status:401});
    if (user.role !== 'admin') return Response.json({error:'Only administrators can access the Experian sandbox.'},{status:403});
    if (req.method !== 'POST') return Response.json({error:'POST required.'},{status:405});
    const input = await req.json();
    if (input.action !== 'sample') return Response.json({error:'Only the fixed sandbox sample is available.'},{status:400});
    if (reportCache && reportCache.until > Date.now()) return Response.json(reportCache.data);
    if (lastAttempt && Date.now() - lastAttempt < 10000) return Response.json({error:'Please wait ten seconds before another sandbox request.'},{status:429});
    lastAttempt = Date.now();
    if (!tokenCache || tokenCache.until <= Date.now()) {
      const clientId = secrets.get('EXPERIAN_SANDBOX_CLIENT_ID');
      const clientSecret = secrets.get('EXPERIAN_SANDBOX_CLIENT_SECRET');
      const username = secrets.get('EXPERIAN_SANDBOX_USERNAME');
      const password = secrets.get('EXPERIAN_SANDBOX_PASSWORD');
      if (!clientId || !clientSecret || !username || !password) return Response.json({error:'Experian sandbox credentials are incomplete.'},{status:503});
      const response = await fetch('https://sandbox-uk-api.experian.com/oauth2/v1/token', {
        method:'POST', signal:AbortSignal.timeout(20000),
        headers:{Accept:'application/json','Content-Type':'application/json',Grant_type:'password'},
        body:JSON.stringify({username,password,client_id:clientId,client_secret:clientSecret})
      });
      if (!response.ok) return Response.json({error:`Experian sandbox authentication failed (HTTP ${response.status}). Check the replacement app credentials and Developer Portal login.`},{status:502});
      const auth = await response.json();
      if (typeof auth.access_token !== 'string' || !auth.access_token) return Response.json({error:'Experian did not return a sandbox access token.'},{status:502});
      const lifetime = Number(auth.expires_in);
      tokenCache = {token:auth.access_token,until:Date.now() + (Number.isFinite(lifetime) ? Math.max(0,Math.min(lifetime,1800)-60) : 0)*1000};
    }
    const response = await fetch('https://sandbox-uk-api.experian.com/risk/business/v2/registeredcompanycredit/99999999', {
      headers:{Accept:'application/json',Authorization:`Bearer ${tokenCache.token}`},signal:AbortSignal.timeout(25000)
    });
    if (!response.ok) {
      if (response.status === 401) tokenCache = null;
      return Response.json({error:`Experian sandbox sample request failed (HTTP ${response.status}). Confirm Commercial Credit Sandbox access in Experian; no ASE rating has changed.`},{status:502});
    }
    const report = await response.json();
    if (String(report.RegNumber) !== '99999999') return Response.json({error:'Experian did not return the expected sample company. No data was saved.'},{status:502});
    const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).slice(0,300) || null : null;
    const nonnegative = value => value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? text(value) : null;
    const delphi = report.CommercialDelphi || {};
    const data = {environment:'sandbox',scoreEligible:false,sampleRegistration:'99999999',fetchedAt:new Date().toISOString(),
      companyName:text(report.CommercialName),creditScore:nonnegative(delphi.CommDelphiScore),riskBand:text(delphi.CommDelphiBandText),
      creditLimit:nonnegative(delphi.CreditLimit),currency:text(report.Identification?.Currency),ccjsLast12Months:nonnegative(report.CCJs?.NumberCCJsLast12Months),
      accountsDate:text(report.ScoringData?.DateOfAccounts)};
    reportCache = {data,until:Date.now()+60000};
    return Response.json(data);
  } catch (error) {
    if (error?.status === 401 || error?.response?.status === 401) return Response.json({error:'Sign in to access the Experian sandbox.'},{status:401});
    return Response.json({error:'The Experian sandbox request could not be completed. Try again; no ASE rating or evidence was changed.'},{status:502});
  }
}