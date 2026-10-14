import {scopedReadCache} from './scopedReadCache.ts';
let queue=Promise.resolve(),nextStart=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function scheduledAggregate(load){
 const run=queue.then(async()=>{
  await sleep(Math.max(0,nextStart-Date.now()));
  nextStart=Date.now()+4500;
  try{return await load();}
  catch(error){
   const status=Number(error.status||error.response?.status);
   if(status!==429&&!/rate limit|too many requests/i.test(error.message||''))throw error;
   // One bounded cooldown, never an immediate retry burst.
   nextStart=Date.now()+61000;
   await sleep(61000);
   nextStart=Date.now()+4500;
   return await load();
  }
 });
 queue=run.then(()=>undefined,()=>undefined);
 return run;
}
// Preserve each entity's existing access scope; only schedule and reuse identical reads.
export function financeReportingReads(client,scopeKey){
 const wrapped=new Map();
 const entities=new Proxy(client.entities,{get(target,name){
  const entity=target[name];
  if(!entity||typeof entity!=='object')return entity;
  if(!wrapped.has(name))wrapped.set(name,new Proxy(entity,{get(source,method){
   if(method==='aggregate')return options=>scopedReadCache(
    JSON.stringify(['finance-aggregate',scopeKey,name,options]),
    ()=>scheduledAggregate(()=>source.aggregate(options))
   );
   const value=source[method];return typeof value==='function'?value.bind(source):value;
  }}));
  return wrapped.get(name);
 }});
 return new Proxy(client,{get(target,name){return name==='entities'?entities:target[name];}});
}