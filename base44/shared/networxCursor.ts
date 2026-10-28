import { secrets } from 'base44:runtime';
const text = new TextEncoder();
const encode = bytes => btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),char=>char.charCodeAt(0));
const binding = context => text.encode(JSON.stringify([context.environment,context.userId,context.principalId,context.entity,context.sourceId]));
async function cursorKey() {
  const hash = await crypto.subtle.digest('SHA-256',text.encode(`ALS Hub:NetworxCursor:v1:${secrets.get('DATAVERSE_CLIENT_SECRET')}`));
  return crypto.subtle.importKey('raw',hash,'AES-GCM',false,['encrypt','decrypt']);
}
export async function encodeNetworxCursor(context, state) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:binding(context)},await cursorKey(),text.encode(JSON.stringify({expires:Date.now()+12*60*60*1000,state})));
  return `${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
}
export async function decodeNetworxCursor(context, cursor) {
  try {
    const [iv,value] = cursor.split('.');
    const raw = await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv),additionalData:binding(context)},await cursorKey(),decode(value));
    const payload = JSON.parse(new TextDecoder().decode(raw));
    if (payload.expires < Date.now()) throw new Error('expired');
    return payload.state;
  } catch {
    const error = new Error('This activity page expired or belongs to a different account. Refresh the timeline.');
    error.status = 400;
    throw error;
  }
}