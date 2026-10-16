export function readPreferenceCache(key,fallback) {
 try {const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'&&!Array.isArray(value)?{...fallback,...value}:fallback;}
 catch {return fallback;}
}
export function writePreferenceCache(key,value) {
 try {localStorage.setItem(key,JSON.stringify(value));return true;}
 catch {return false;}
}