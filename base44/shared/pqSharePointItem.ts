export async function pqSharePointItem(reads,link){
 try{return await reads.resolve(link);}catch(error){
  // Saved browser links can outlive their sharing token. Resolve their exact saved path instead.
  const url=new URL(link),path=decodeURIComponent(url.pathname.replace(/^\/:[a-z]:\/r\//i,'/'));
  const match=path.match(/^\/(sites|teams)\/([^/]+)\/(.+)$/);
  if(url.hostname!=='allianceleisureservice.sharepoint.com'||!match)throw error;
  const site=await reads.graph(`/sites/${url.hostname}:/${match[1]}/${encodeURIComponent(match[2])}`);
  const drives=await reads.graph(`/sites/${site.id}/drives?$select=id,webUrl`);
  const drive=drives.value.find(item=>path.startsWith(decodeURIComponent(new URL(item.webUrl).pathname)+'/'));
  if(!drive)throw error;
  const relative=path.slice(decodeURIComponent(new URL(drive.webUrl).pathname).length+1).split('/').map(encodeURIComponent).join('/');
  return await reads.graph(`/drives/${encodeURIComponent(drive.id)}/root:/${relative}?$select=id,name,webUrl,parentReference,folder,file`);
 }
}