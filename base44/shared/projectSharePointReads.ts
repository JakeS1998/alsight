export async function projectSharePointReads(base44) {
 const {accessToken}=await base44.asServiceRole.connectors.getConnection('share_point');
 async function graph(path) {
  if(!path.startsWith('/'))throw new Error('Invalid SharePoint request.');
  const response=await fetch('https://graph.microsoft.com/v1.0'+path,{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(30000)});
  const text=await response.text(),data=text?JSON.parse(text):null;
  if(!response.ok)throw new Error(data?.error?.message || `SharePoint returned ${response.status}.`);
  return data;
 }
 async function resolve(link) {
  const url=new URL(link);
  if(url.protocol!=='https:' || url.hostname!=='allianceleisureservice.sharepoint.com')throw new Error('Use a saved Alliance SharePoint document link.');
  const share='u!'+btoa(unescape(encodeURIComponent(link))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return graph(`/shares/${share}/driveItem?$select=id,name,webUrl,parentReference,folder,file`);
 }
 async function children(item) {
  let path=`/drives/${item.parentReference.driveId}/items/${item.id}/children?$select=id,name,webUrl,parentReference,file,folder&$top=100`,items=[];
  while(path) {
   const page=await graph(path);items.push(...page.value);
   if(items.length>300)throw new Error('This LOI folder has too many files; link a more specific folder.');
   path=page['@odata.nextLink'] ? new URL(page['@odata.nextLink']).pathname.replace('/v1.0','')+new URL(page['@odata.nextLink']).search : null;
  }
  return items;
 }
 return {graph,resolve,children};
}