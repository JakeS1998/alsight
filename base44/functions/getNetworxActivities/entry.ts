import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { networxContext } from '../../shared/networxContext.ts';
import { validateNetworxInput } from '../../shared/networxQueries.ts';
import { readNetworxActivities } from '../../shared/networxReads.ts';
export default async function(req) {
  try {
    const client = createClientFromRequest(req);
    if (req.method !== 'POST') return Response.json({error:'Method not allowed.'},{status:405});
    const input = await req.json().catch(()=>({}));
    const invalid = validateNetworxInput(input);
    if (invalid) return Response.json({error:invalid},{status:400});
    const context = await networxContext(client,input);
    if (context.state) return Response.json(context,{headers:{'Cache-Control':'no-store'}});
    const result = await readNetworxActivities(context,input);
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const code = Number(error?.response?.status || error?.status);
    const status = [400,401,403,404,429].includes(code) ? code : 502;
    return Response.json({error:error.message || 'Dataverse activity could not be loaded.'},{status});
  }
}