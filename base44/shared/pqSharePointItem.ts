export async function pqSharePointItem(reads,link){
 try{return await reads.resolve(link);}catch(error){
  // Saved browser links can outlive their sharing token. Resolve their exact saved path instead.
  const url=new URL(link),path=decodeURIComponent(url.pathname.replace(/^\/:[a-z]:\/r\//i,'/'));
  const match=path.match(/^\/(sites|teams)\/([^/]+)\/(.+)$/);
  if(url.hostname!=='allianceleisureservice.sharepoint.com'||!match)throw error;
  const site=await reads.graph(`/sites/${url.hostname}:/${match[1]}/${encodeURIComponent(match[2])}`);
  const sourceId=(url.searchParams.get('sourcedoc')||'').replace(/[{}]/g,'');
  if(/^_layouts\//i.test(match[3])&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(sourceId)){
   // Viewer links identify the file by its permanent list-item GUID, not a file path.
   const lists=await reads.graph(`/sites/${site.id}/lists?$select=id,list&$top=100`);
   if(lists['@odata.nextLink'])throw new Error('Too many SharePoint lists. Set the PQ link to its direct document URL.');
   const libraries=lists.value.filter(list=>list.list?.template==='documentLibrary');
   if(libraries.length>20)throw new Error('Too many SharePoint document libraries. Set the PQ link to its direct document URL.');
   for(let i=0;i<libraries.length;i+=4){
    const results=await Promise.allSettled(libraries.slice(i,i+4).map(list=>reads.graph(`/sites/${site.id}/lists/${encodeURIComponent(list.id)}/items/${sourceId}/driveItem?$select=id,name,webUrl,parentReference,folder,file`)));
    const found=results.filter(result=>result.status==='fulfilled').map(result=>result.value);
    if(found.length===1)return found[0];
    if(found.length>1)throw new Error('Several matching documents were found. Set the PQ link to the exact document.');
   }
   throw error;
  }
  const drives=await reads.graph(`/sites/${site.id}/drives?$select=id,webUrl`);
  const drive=drives.value.find(item=>path.startsWith(decodeURIComponent(new URL(item.webUrl).pathname)+'/'));
  if(!drive)throw error;
  const relative=path.slice(decodeURIComponent(new URL(drive.webUrl).pathname).length+1).split('/').map(encodeURIComponent).join('/');
  return await reads.graph(`/drives/${encodeURIComponent(drive.id)}/root:/${relative}?$select=id,name,webUrl,parentReference,folder,file`);
 }
}