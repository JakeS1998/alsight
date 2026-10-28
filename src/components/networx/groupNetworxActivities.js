export default function groupNetworxActivities(rows) {
 const parents=new Map(),seen=new Set(),unique=rows.filter(row=>{const key=`${row.kind}:${row.id}`;if(seen.has(key))return false;seen.add(key);return true;});
 const find=key=>{if(!parents.has(key))parents.set(key,key);if(parents.get(key)!==key)parents.set(key,find(parents.get(key)));return parents.get(key);};
 const aliases=row=>row.threadAliases?.length ? row.threadAliases : [`email:${row.id}`];
 unique.filter(row=>row.kind==='email').forEach(row=>{const keys=aliases(row),root=find(keys[0]);keys.slice(1).forEach(key=>parents.set(find(key),find(root)));});
 const canonical=new Map();
 unique.filter(row=>row.kind==='email').forEach(row=>{const root=find(aliases(row)[0]),index=aliases(row).find(key=>key.startsWith('index:')),candidate={key:index || `email:${row.threadId || row.id}`,rank:index ? 0 : row.threadId && row.threadId!==row.id ? 1 : 2};if(!canonical.has(root) || candidate.rank<canonical.get(root).rank)canonical.set(root,candidate);});
 const groups=new Map(),items=[];
 unique.forEach(row=>{
  if(row.kind!=='email'){items.push({key:`${row.kind}:${row.id}`,row});return;}
  const key=find(aliases(row)[0]);
  if(!groups.has(key)){const group={key:`thread:${canonical.get(key).key}`,row,thread:true};groups.set(key,group);items.push(group);}
 });
 return items;
}