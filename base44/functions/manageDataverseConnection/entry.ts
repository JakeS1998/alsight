import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dataverseEnvironment } from '../../shared/dataverseConnection.ts';
import { checkPersonalDataverse } from '../../shared/dataverseUserAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const input = await req.json();
    if (!['get', 'save', 'check'].includes(input.action)) return Response.json({ error: 'Invalid connection operation.' }, { status: 400 });
    const page = await base44.entities.DataverseConnection.filter({ key: 'primary' }, { limit: 1 });
    const connection = page.items[0] || null;
    if (input.action === 'get') return Response.json({ connection });
    if (input.action === 'save') {
      let environment;
      try { environment = dataverseEnvironment(input.environment_url); }
      catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
      const values = { key: 'primary', environment_url: environment, status: 'not_checked', last_error: '', last_checked_at: null, organisation_id: '', application_user_id: '' };
      const saved = connection ? await base44.entities.DataverseConnection.update(connection.id, values) : await base44.entities.DataverseConnection.create(values);
      return Response.json({ connection: saved });
    }
    try {
      const personal = await checkPersonalDataverse(base44, user);
      return Response.json({ connection: personal });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to manage the Dataverse connection.' }, { status: 500 });
  }
}