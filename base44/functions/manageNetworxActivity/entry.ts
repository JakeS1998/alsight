import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {networxContext} from '../../shared/networxContext.ts';
import networxActivityInput from '../../shared/networxActivityInput.ts';
import {networxRecipients} from '../../shared/networxRecipients.ts';
import networxActivitySave from '../../shared/networxActivitySave.ts';
export default async function(req) {
 const headers={'Cache-Control':'no-store'};
 try {
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405,headers});
  const input=await req.json().catch(()=>null);
  const invalid=networxActivityInput(input);if(invalid)return Response.json({error:invalid},{status:400,headers});
  const client=createClientFromRequest(req),context=await networxContext(client,input);
  if(context.state)return Response.json(context,{headers});
  if(input.action==='prepare')return Response.json({state:'ready',recipients:await networxRecipients(context)},{headers});
  return Response.json(await networxActivitySave(client,context,input),{headers});
 }catch(error){const code=Number(error?.response?.status || error?.status);return Response.json({error:error?.response?.data?.error || error.message || 'Unable to save this activity.'},{status:[400,401,403,404,409,429].includes(code) ? code : 502,headers});}
}