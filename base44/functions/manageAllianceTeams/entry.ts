import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to use Teams.' }, { status: 401 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    if (!['admin','director','regional_director','bsm','bdm','finance'].includes(user.role)) return Response.json({ error: 'Teams project sharing is for internal staff.' }, { status: 403 });
    const input = await req.json();
    if (!['status','teams','channels','share'].includes(input.action)) return Response.json({ error: 'Invalid Teams operation.' }, { status: 400 });
    let connection;
    try { connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6ac767c8caa8fda818b4f2e2'); }
    catch { return Response.json({ error: 'Connect your own Alliance Teams account in Account Settings.', code: 'TEAMS_NOT_CONNECTED' }, { status: 409 }); }
    if (!connection?.accessToken) return Response.json({ error: 'Connect your own Alliance Teams account.', code: 'TEAMS_NOT_CONNECTED' }, { status: 409 });
    const graph = async (path, method = 'GET', body) => {
      const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, { method, signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok) { const error = new Error(response.status === 403 ? 'Microsoft denied access. Ask IT to approve Alliance Teams permissions.' : response.status === 401 ? 'Reconnect your Teams account in Account Settings.' : 'Teams could not complete this request. Please try again.'); error.status = response.status; throw error; }
      const text = await response.text(); return text ? JSON.parse(text) : null;
    };
    if (input.action === 'status') { const me = await graph('/me?$select=displayName'); return Response.json({ connected: true, name: me.displayName }); }
    const teamPage = await graph('/me/joinedTeams?$select=id,displayName');
    if (input.action === 'teams') return Response.json({ items: teamPage.value || [] });
    if (typeof input.teamId !== 'string' || !teamPage.value?.some(team => team.id === input.teamId)) return Response.json({ error: 'Choose a team you belong to.' }, { status: 400 });
    const channels = await graph(`/teams/${encodeURIComponent(input.teamId)}/channels?$select=id,displayName,membershipType`);
    if (input.action === 'channels') return Response.json({ items: channels.value || [] });
    if (typeof input.channelId !== 'string' || !channels.value?.some(channel => channel.id === input.channelId)) return Response.json({ error: 'Choose a channel in this team.' }, { status: 400 });
    if (typeof input.projectId !== 'string' || input.projectId.length > 100 || typeof input.message !== 'string' || !input.message.trim() || input.message.length > 2000) return Response.json({ error: 'Choose a project and enter an update of up to 2,000 characters.' }, { status: 400 });
    const project = await base44.entities.Project.get(input.projectId);
    if (!project) return Response.json({ error: 'Project not accessible.' }, { status: 404 });
    const message = await graph(`/teams/${encodeURIComponent(input.teamId)}/channels/${encodeURIComponent(input.channelId)}/messages`, 'POST', { body: { contentType: 'text', content: `${project.name}\n\n${input.message.trim()}\n\nhttps://alsight.base44.app/projects/${encodeURIComponent(project.id)}` } });
    return Response.json({ sent: true, webUrl: message?.webUrl });
  } catch (error) { return Response.json({ error: error.message, ...(error.status === 401 ? { code: 'TEAMS_NOT_CONNECTED' } : {}) }, { status: error.status === 401 ? 409 : error.status === 403 ? 403 : 500 }); }
}