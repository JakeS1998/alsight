import { secrets } from 'base44:runtime';
import {delegatedPowerBIToken} from './powerBIUserAuth.ts';
export const financeRoles = ['admin','finance','director'];
const guid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function reportAddress(value){
 const u=new URL(String(value||''));
 if(u.protocol!=='https:'||u.hostname!=='app.powerbi.com'||u.username||u.password||u.port)throw new Error('Use the report’s HTTPS app.powerbi.com link.');
 const m=u.pathname.match(/^\/groups\/([^/]+)\/reports\/([^/]+)/);
 if(!m||!guid.test(m[1])||!guid.test(m[2]))throw new Error('Open the report in its workspace and copy the link containing groups/<workspace ID>/reports/<report ID>.');
 return {report_url:u.href,workspace_id:m[1],report_id:m[2]};
}
export function validateSources(value){
 const sources={};
 for(const type of ['SO','PO']){sources[type]={};for(const field of ['table','project','code','reference','value']){
 const v=String(value?.[type]?.[field]||'').trim();
 if((field!=='code'&&!v)|| (v&&!/^[\p{L}\p{N}_ .()%&/\-]{1,120}$/u.test(v)))throw new Error(`${type}: enter valid table, project-name, order-reference and net-value columns. Project-code column is optional.`);
 sources[type][field]=v;
 }}return sources;
}
export async function powerToken(base44){
 if(base44){const delegated=await delegatedPowerBIToken(base44);if(delegated)return delegated;}
 const tenant=secrets.get('POWERBI_TENANT_ID')?.trim(),client=secrets.get('POWERBI_CLIENT_ID')?.trim(),secret=secrets.get('POWERBI_CLIENT_SECRET');
 if(!guid.test(tenant||'')||!guid.test(client||'')||!secret)throw new Error('Ask your Microsoft administrator to confirm the stored Power BI application credentials.');
 const r=await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:client,client_secret:secret,scope:'https://analysis.windows.net/powerbi/api/.default'})});
 const d=await r.json();if(!r.ok||!d.access_token)throw new Error('Microsoft could not authorise the Power BI application. Check the tenant, client ID, secret value and expiry.');return d.access_token;
}
export async function powerRequest(token,path,body){
 const r=await fetch(`https://api.powerbi.com/v1.0/myorg/${path}`,{method:body?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(45000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 if(r.status>=300&&r.status<400)throw new Error('Power BI returned an unexpected redirect. Ask your Microsoft administrator to check the connection.');
 const d=await r.json();
 if(!r.ok)throw new Error([401,403].includes(r.status)?'Power BI denied access. Check workspace Read/Build access, service-principal API access and Dataset Execute Queries settings. Models with RLS or SSO need delegated-user access.':r.status===429?'Power BI is busy. Wait a minute before refreshing.':`Power BI could not read this report or model (HTTP ${r.status}). Check the report link and column selections.`);
 return d;
}
export async function powerQuery(token,dataset,query){
 const d=await powerRequest(token,`datasets/${dataset}/executeQueries`,{queries:[{query}],serializerSettings:{includeNulls:true}});
 const error=d.error||d.results?.find(r=>r.error)?.error;
 if(error)throw new Error('Power BI could not complete the selected query. Check table/column names, numeric net-value columns and model access; partial results are not accepted.');
 if(!d.results?.[0]?.tables?.[0])throw new Error('Power BI returned no result table.');
 return (d.results[0].tables[0].rows||[]).map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/^\[|\]$/g,''),v])));
}