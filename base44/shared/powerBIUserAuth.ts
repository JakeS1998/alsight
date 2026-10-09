import {powerBICredentials,powerBIReturnUrl,powerBIScope,encodePowerBytes,decodePowerBytes,encryptPowerPayload,decryptPowerPayload,exchangePowerToken} from './powerBIUserOAuth.ts';
export async function powerBIConnectionRecord(base44){return (await base44.asServiceRole.entities.PowerBIUserConnection.filter({key:'primary'},{limit:1})).items[0]||null;}
export function powerBIConnectionSummary(record){return {connected:record?.status==='connected',account_name:record?.account_name||'',last_checked_at:record?.last_checked_at||null,redirect_uri:powerBIReturnUrl};}
export async function beginPowerBISignIn(base44,user){
 const {tenant,client}=powerBICredentials(),record=await powerBIConnectionRecord(base44);
 const verifier=encodePowerBytes(crypto.getRandomValues(new Uint8Array(32))),state=encodePowerBytes(crypto.getRandomValues(new Uint8Array(32))),nonce=encodePowerBytes(crypto.getRandomValues(new Uint8Array(32)));
 const challenge=encodePowerBytes(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 const pending_payload=await encryptPowerPayload({verifier,state,nonce,expires_at:Date.now()+600000,user_id:user.id});
 const values={pending_payload,pending_user_id:user.id};
 if(record)await base44.asServiceRole.entities.PowerBIUserConnection.update(record.id,values);
 else await base44.asServiceRole.entities.PowerBIUserConnection.create({key:'primary',status:'disconnected',...values});
 const params=new URLSearchParams({client_id:client,response_type:'code',redirect_uri:powerBIReturnUrl,response_mode:'query',scope:powerBIScope,state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'});
 return {authorization_url:`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`};
}
export async function finishPowerBISignIn(base44,user,input){
 const record=await powerBIConnectionRecord(base44);
 if(!record?.pending_payload||record.pending_user_id!==user.id)throw new Error('Start Power BI sign-in again from Finance reporting setup.');
 if(typeof input.state!=='string'||input.state.length>100||typeof input.code!=='string'||!input.code||input.code.length>10000)throw new Error('Invalid Microsoft sign-in response.');
 const session=await decryptPowerPayload(record.pending_payload);
 if(session.state!==input.state||session.user_id!==user.id||session.expires_at<Date.now())throw new Error('This Microsoft sign-in request expired or does not match your account. Start again.');
 await base44.asServiceRole.entities.PowerBIUserConnection.update(record.id,{pending_payload:'',pending_user_id:''});
 const tokens=await exchangePowerToken({grant_type:'authorization_code',code:input.code,code_verifier:session.verifier,redirect_uri:powerBIReturnUrl});
 const identity=JSON.parse(new TextDecoder().decode(decodePowerBytes(tokens.id_token.split('.')[1]||'')));
 if(identity.nonce!==session.nonce||identity.aud!==powerBICredentials().client||identity.tid!==powerBICredentials().tenant||Number(identity.exp)*1000<Date.now())throw new Error('Microsoft returned an unexpected account identity. Start sign-in again.');
 const scopeTokens={access_token:tokens.access_token,refresh_token:tokens.refresh_token,expires_at:tokens.expires_at};
 const saved=await base44.asServiceRole.entities.PowerBIUserConnection.update(record.id,{status:'connected',connected_by_id:user.id,account_name:String(identity.name||'').slice(0,200),encrypted_payload:await encryptPowerPayload(scopeTokens),last_checked_at:null});
 return powerBIConnectionSummary(saved);
}
export async function delegatedPowerBIToken(base44){
 const record=await powerBIConnectionRecord(base44);
 if(record?.status!=='connected')return null;
 let tokens=await decryptPowerPayload(record.encrypted_payload);
 if(tokens.expires_at<=Date.now()+60000){
  if(!tokens.refresh_token)throw new Error('Reconnect Power BI through Microsoft sign-in.');
  tokens=await exchangePowerToken({grant_type:'refresh_token',refresh_token:tokens.refresh_token});
  await base44.asServiceRole.entities.PowerBIUserConnection.update(record.id,{encrypted_payload:await encryptPowerPayload({access_token:tokens.access_token,refresh_token:tokens.refresh_token,expires_at:tokens.expires_at})});
 }
 return tokens.access_token;
}