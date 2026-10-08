import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dataverseRoles, personalDataverseContext, personalDataverseSummary, beginDataverseSignIn, finishDataverseSignIn, checkPersonalDataverse } from '../../shared/dataverseUserAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (!dataverseRoles.includes(user.role)) return Response.json({ error: 'Dataverse access is available to internal staff only.' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const input = await req.json();
    if (!['status', 'begin', 'finish', 'check', 'disconnect'].includes(input.action)) return Response.json({ error: 'Invalid Dataverse operation.' }, { status: 400 });
    const { environment, record } = await personalDataverseContext(base44, user);
    if (input.action === 'status') return Response.json(personalDataverseSummary(environment, record));
    if (input.action === 'begin') return Response.json(await beginDataverseSignIn(base44, user, environment, record));
    if (input.action === 'finish') return Response.json(await finishDataverseSignIn(base44, user, environment, record, input));
    if (input.action === 'check') return Response.json(await checkPersonalDataverse(base44, user));
    if (record) await base44.asServiceRole.entities.DataverseUserConnection.delete(record.id);
    return Response.json(personalDataverseSummary(environment, null));
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to access Dataverse.' }, { status: 400 });
  }
}