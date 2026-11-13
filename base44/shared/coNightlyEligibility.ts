export function nightlyDueQuery(c){
 const at=c.policy?.nightly_sync_at;
 return {$or:[{'state.last_success':{$exists:false}},{'state.last_success':{$in:[null,'']}},{'state.cycle_start':{$exists:true,$nin:[null,'']}},...(at?[{'state.last_success':{$lt:at}}]:[])]};
}
export const retryDueQuery=at=>({$or:[{'state.retry_after':{$exists:false}},{'state.retry_after':{$in:[null,'']}},{'state.retry_after':{$lte:at}}]});
export function shouldCopyFile(item,prior,watermark){
 if(!prior?.file_uri)return true;
 const modified=Date.parse(item.lastModifiedDateTime||''),copied=Date.parse(prior.source_modified||''),checkpoint=Date.parse(watermark||'');
 if(Number.isFinite(modified)){
  if(Number.isFinite(copied)&&modified<=copied&&prior.source_etag===item.eTag)return false;
  if(Number.isFinite(checkpoint)&&modified<=checkpoint)return false;
  return true;
 }
 return prior.source_etag!==item.eTag;
}