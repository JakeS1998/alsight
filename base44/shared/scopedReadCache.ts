const entries=new Map();
export async function scopedReadCache(key,load) {
 const saved=entries.get(key);
 if(saved && (saved.pending || saved.expires>Date.now()))return saved.promise;
 if(entries.size>=100)entries.delete(entries.keys().next().value);
 const entry={pending:true,expires:0,promise:null};
 entry.promise=load().then(value=>{entry.pending=false;entry.expires=Date.now()+60000;return value;}).catch(error=>{if(entries.get(key)===entry)entries.delete(key);throw error;});
 entries.set(key,entry);return entry.promise;
}
export function invalidateScopedRead(prefix) {for(const key of entries.keys())if(key.startsWith(prefix))entries.delete(key);}