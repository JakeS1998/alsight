import {outlookBriefingText} from './outlookBriefingText.ts';
export async function outlookUnreadEmails(base44,graph,input){
 const start=Date.parse(input.start),end=Date.parse(input.end),now=Date.now();
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>26*3600000||start>now||start<now-48*3600000||end>now+26*3600000||input.summarise!==undefined&&typeof input.summarise!=='boolean')return Response.json({error:'Choose today’s email range.'},{status:400});
 const fields='id,subject,from,receivedDateTime,bodyPreview,webLink,isRead,importance';
 const filter=`receivedDateTime ge ${new Date(start).toISOString()} and receivedDateTime lt ${new Date(end).toISOString()} and isRead eq false`;
 const params=new URLSearchParams({'$filter':filter,'$orderby':'receivedDateTime desc','$select':fields,'$top':'10'});
 let path=`/me/messages?${params}`;
 if(input.cursor){
  let url;try{url=new URL(input.cursor);}catch{return Response.json({error:'Invalid email page.'},{status:400});}
  if(url.origin!=='https://graph.microsoft.com'||url.pathname!=='/v1.0/me/messages'||url.username||url.password||url.hash||url.searchParams.get('$filter')!==filter||url.searchParams.get('$select')!==fields||url.searchParams.get('$top')!=='10'||url.searchParams.get('$orderby')!=='receivedDateTime desc')return Response.json({error:'Invalid email page.'},{status:400});
  path=url.pathname.slice('/v1.0'.length)+url.search;
 }
 const page=await graph(path),messages=(page.value||[]).map(m=>({id:m.id,subject:String(m.subject||'Untitled email').slice(0,300),sender:String(m.from?.emailAddress?.name||m.from?.emailAddress?.address||'Unknown sender').slice(0,254),receivedAt:m.receivedDateTime,preview:String(m.bodyPreview||'').slice(0,600),href:m.webLink,importance:m.importance}));
 const briefing=input.summarise&&messages.length?await outlookBriefingText(base44,'mail',{start:input.start,end:input.end,messages:messages.map(({subject,sender,receivedAt,preview,importance})=>({subject,sender,receivedAt,preview,importance}))}):null;
 return Response.json({messages,next_cursor:page['@odata.nextLink']||null,briefing,refreshedAt:new Date().toISOString()});
}