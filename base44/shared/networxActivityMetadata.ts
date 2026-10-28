const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function networxActivityFingerprint(input) {
 const canonical={kind:input.kind,subject:input.subject.trim(),notes:input.notes,location:input.location.trim(),start:input.start,end:input.end,direction:input.kind==='call' ? input.direction : '',phone:input.kind==='call' ? input.phone : '',people:input.people.map(person=>`${person.entity}:${person.id.toLowerCase()}`).sort()};
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical))))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function networxActivityDescription(notes,metadata) {
 const bytes=new TextEncoder().encode(JSON.stringify(metadata));
 const encoded=btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join(''));
 return `<div>${escape(notes).replace(/\r?\n/g,'<br>')}</div><!--networx-activity:${encoded}-->`;
}
export function networxActivityMetadata(description) {
 const match=String(description || '').match(/<!--networx-activity:([A-Za-z0-9+/=]{1,16000})-->/);
 if(!match)return null;
 try{return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(match[1]),character=>character.charCodeAt(0))));}catch{return null;}
}
export function networxMeetingLink(value,teams=false) {
 try {const url=new URL(value);const hosts=teams ? ['teams.microsoft.com','teams.live.com','teams.cloud.microsoft'] : ['outlook.office.com','outlook.office365.com','outlook.live.com'];return url.protocol==='https:' && !url.username && !url.password && hosts.includes(url.hostname) ? url.href : null;}catch{return null;}
}