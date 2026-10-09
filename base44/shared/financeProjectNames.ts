const escape=v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function namePattern(name){
 const words=String(name||'').toLowerCase().replace(/&/g,' and ').match(/[a-z0-9]+/g)||[];
 return words.length?'^[^a-z0-9]*'+words.map((w,i)=>(i?(w==='and'||words[i-1]==='and'?'[^a-z0-9]*':'[^a-z0-9]+'):'')+(w==='and'?'(?:and|&)':escape(w))).join('')+'[^a-z0-9]*$':null;
}
export function legacyNamePattern(name){
 const base=String(name||'').replace(/\s*\([^)]*\)\s*$/,'').replace(/\s+(refurbishment|refurb)\s*$/i,'').trim();
 const pattern=namePattern(base);if(!pattern||base.length<8)return namePattern(name);
 return pattern.replace('[^a-z0-9]*$','(?:[^a-z0-9]+(?:refurbishment|refurb))?(?:[^a-z0-9]+\\([^)]*\\))?[^a-z0-9]*$');
}