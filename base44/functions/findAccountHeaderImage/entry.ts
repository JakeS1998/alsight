import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { searchHeaderPhoto } from '../../shared/searchHeaderPhoto.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const { accountId } = await req.json();
    if (typeof accountId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(accountId)) return Response.json({ error: 'Invalid account reference' }, { status: 400 });
    const account = await base44.entities.Account.get(accountId);
    if (!account) return Response.json({ error: 'Account unavailable' }, { status: 403 });
    const name = String(account.name || '').replace(/["\r\n]/g, ' ').slice(0,160);
    const location = String(account.address_city || account.address_postcode || '').replace(/["\r\n]/g,' ').slice(0,80);
    const subject = /council|local authority|borough/i.test(name) ? 'council offices building' : 'headquarters building';
    const result = await searchHeaderPhoto(`"${name}" ${location} ${subject}`, `${name} organisation photograph`);
    return Response.json(result.body, { status: result.status });
  } catch { return Response.json({ error: 'Unable to find an account photograph' }, { status: 500 }); }
}