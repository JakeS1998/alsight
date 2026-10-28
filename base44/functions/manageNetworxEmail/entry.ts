import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { networxContext } from '../../shared/networxContext.ts';
import networxEmailInput from '../../shared/networxEmailInput.ts';
import { networxMailbox, enableNetworxReplyTracking } from '../../shared/networxMailbox.ts';
import { networxRecipients } from '../../shared/networxRecipients.ts';
import { sendNetworxEmail } from '../../shared/networxSendEmail.ts';
export default async function(req) {
  const headers = {'Cache-Control':'no-store'};
  try {
    if (req.method!=='POST') return Response.json({error:'Method not allowed.'},{status:405,headers});
    const input = await req.json().catch(()=>null);
    const invalid = networxEmailInput(input);
    if (invalid) return Response.json({error:invalid},{status:400,headers});
    const context = await networxContext(createClientFromRequest(req),input);
    if (context.state) return Response.json(context,{headers});
    if (input.action==='send') return Response.json(await sendNetworxEmail(context,input),{headers});
    if (input.action==='enable_tracking') return Response.json({state:'ready',mailbox:await enableNetworxReplyTracking(context)},{headers});
    if (input.action==='recipients') return Response.json({state:'ready',recipients:await networxRecipients(context,input.search || '')},{headers});
    const [mailbox,recipients] = await Promise.all([networxMailbox(context),networxRecipients(context)]);
    return Response.json({state:'ready',mailbox,recipients},{headers});
  } catch (error) {
    const code = Number(error?.response?.status || error?.status);
    return Response.json({error:error.message || 'Dataverse email could not be accessed.'},{status:[400,401,403,404,409,429].includes(code) ? code : 502,headers});
  }
}