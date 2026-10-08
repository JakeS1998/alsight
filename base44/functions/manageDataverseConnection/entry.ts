import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dataverseEnvironment, checkDataverseIdentity } from '../../shared/dataverseConnection.ts';

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
    if (!connection) return Response.json({ error: 'Save your Dataverse environment address first.' }, { status: 400 });
    let identity;
    try { identity = await checkDataverseIdentity(connection.environment_url); }
    catch (error) {
      const message = error.name === 'TimeoutError' || error.name === 'AbortError' ? 'The connection timed out. Try again or ask IT to check service availability.' : error instanceof TypeError ? 'Unable to reach Microsoft or Dataverse. Check the environment address and try again.' : error.message;
      await base44.entities.DataverseConnection.update(connection.id, { status: 'failed', last_checked_at: new Date().toISOString(), last_error: message.slice(0, 1000), organisation_id: '', application_user_id: '' });
      return Response.json({ error: message }, { status: 400 });
    }
    const checked = await base44.entities.DataverseConnection.update(connection.id, { ...identity, status: 'connected', last_checked_at: new Date().toISOString(), last_error: '' });
    return Response.json({ connection: checked });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to manage the Dataverse connection.' }, { status: 500 });
  }
}