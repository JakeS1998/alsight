import { secrets } from 'base44:runtime';
export const powerBIReturnUrl='https://alsight.base44.app/powerbi-callback';
export const powerBIScope='https://analysis.windows.net/powerbi/api/Report.Read.All https://analysis.windows.net/powerbi/api/Dataset.Read.All offline_access openid profile';
const encoder=new TextEncoder();
export const encodePowerBytes=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function decodePowerBytes(value){const s=value.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(s.padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));}
export function powerBICredentials(){
 const tenant=secrets.get('POWERBI_TENANT_ID')?.trim(),client=secrets.get('POWERBI_CLIENT_ID')?.trim(),secret=secrets.get('POWERBI_CLIENT_SECRET');
 const guid=/^[0-9a-f-]{36}$/i;
 if(!guid.test(tenant||'')||!guid.test(client||'')||!secret)throw new Error('Ask IT to confirm the stored Power BI application credentials.');
 return {tenant,client,secret};
}
async function key(){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`ALSight:PowerBIUser:v1:${powerBICredentials().secret}`));return crypto.subtle.importKey('raw',digest,'AES-GCM',false,['encrypt','decrypt']);}
export async function encryptPowerPayload(value){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('PowerBI:primary')},await key(),encoder.encode(JSON.stringify(value)));
 return `${encodePowerBytes(iv)}.${encodePowerBytes(new Uint8Array(encrypted))}`;
}
export async function decryptPowerPayload(value){
 const [iv,data]=String(value||'').split('.');
 try{return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decodePowerBytes(iv),additionalData:encoder.encode('PowerBI:primary')},await key(),decodePowerBytes(data))));}
 catch{throw new Error('Start Power BI Microsoft sign-in again.');}
}
export async function exchangePowerToken(parameters){
 const {tenant,client,secret}=powerBICredentials();
 const r=await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:client,client_secret:secret,scope:powerBIScope,...parameters})});
 if(r.status>=300&&r.status<400)throw new Error('Microsoft returned an unexpected authentication redirect.');
 const d=await r.json();
 if(!r.ok||!d.access_token){const messages={invalid_client:'Microsoft rejected the Power BI application credentials. Ask IT to check the secret and expiry.',invalid_grant:'Microsoft sign-in expired or was revoked. Sign in again.',invalid_scope:'Ask IT to add Power BI delegated Report.Read.All and Dataset.Read.All permissions.',unauthorized_client:'Ask IT to enable delegated Microsoft sign-in for the Power BI application.',consent_required:'Ask IT to approve the Power BI delegated permissions.'};throw new Error(messages[d.error]||'Microsoft sign-in failed. Ask IT to check delegated permissions, consent and the Web return address.');}
 return {access_token:d.access_token,refresh_token:d.refresh_token||parameters.refresh_token||'',expires_at:Date.now()+Number(d.expires_in||3600)*1000,id_token:d.id_token||''};
}