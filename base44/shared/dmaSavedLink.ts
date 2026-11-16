export async function resolveDMASavedLink(reads,link) {
 try {return await reads.resolve(link);}catch(original){
  const url=new URL(link),path=decodeURIComponent(url.searchParams.get('id')||url.searchParams.get('RootFolder')||url.pathname).replace(/^\/:[a-z]+:\/r\//i,'/');
  const match=path.match(/^\/(sites|teams)\/([^/]+)(\/.*)?$/i);
  if(url.protocol!=='https:'||url.hostname!=='allianceleisureservice.sharepoint.com'||!match||/\/Forms\/[^/]+\.aspx$/i.test(path))throw original;
  const sitePath=`/${match[1]}/${match[2]}`,site=await reads.graph(`/sites/${url.hostname}:${sitePath.split('/').map(encodeURIComponent).join('/')}`);
  let next=`/sites/${encodeURIComponent(site.id)}/drives?$select=id,webUrl&$top=100`,drive=null,base='';
  for(let n=0;next&&n<5;n++){
   const page=await reads.graph(next);
   for(const item of page.value||[]){const prefix=decodeURIComponent(new URL(item.webUrl).pathname).replace(/\/$/,'');if((path===prefix||path.startsWith(prefix+'/'))&&prefix.length>base.length){drive=item;base=prefix;}}
   next=page['@odata.nextLink']?new URL(page['@odata.nextLink']).pathname.replace('/v1.0','')+new URL(page['@odata.nextLink']).search:null;
  }
  if(!drive)throw original;
  const relative=path.slice(base.length).replace(/^\//,'');
  const item=await reads.graph(`/drives/${encodeURIComponent(drive.id)}/root${relative?':/'+relative.split('/').map(encodeURIComponent).join('/'):''}?$select=id,name,webUrl,parentReference,folder,file`);
  return {...item,parentReference:{...item.parentReference,driveId:drive.id}};
 }
}