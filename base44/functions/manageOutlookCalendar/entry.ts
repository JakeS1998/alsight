import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const connectorId = '6ac767410e11df12db6e136f';
const fields = 'id,subject,start,end,isAllDay,location,bodyPreview,attendees,isOrganizer,webLink,type,isOnlineMeeting,onlineMeeting,onlineMeetingProvider';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to access your calendar.' }, { status: 401 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const input = await req.json();
    if (!['status', 'list', 'get', 'create', 'update', 'delete'].includes(input.action)) return Response.json({ error: 'Invalid calendar operation.' }, { status: 400 });
    const timeZone = input.timeZone || 'UTC';
    try { if (typeof timeZone !== 'string' || timeZone.length > 100) throw new Error(); new Intl.DateTimeFormat('en', { timeZone }); }
    catch { return Response.json({ error: 'Invalid calendar timezone.' }, { status: 400 }); }
    let connection;
    try { connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId); }
    catch { return Response.json({ error: 'Connect your own Outlook account in Account Settings.', code: 'OUTLOOK_NOT_CONNECTED' }, { status: 409 }); }
    if (!connection?.accessToken) return Response.json({ error: 'Connect your Outlook account.', code: 'OUTLOOK_NOT_CONNECTED' }, { status: 409 });
    const graph = async (path, method = 'GET', body = undefined) => {
      const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        method, signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json', Prefer: `outlook.timezone="${timeZone}", outlook.body-content-type="text"` },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (!response.ok) {
        const error = new Error(response.status === 401 ? 'Your Outlook connection needs to be renewed.' : response.status === 403 ? 'Microsoft denied calendar access. Check your calendar permissions with IT.' : response.status === 429 ? 'Outlook is busy. Please try again shortly.' : 'Outlook could not complete this calendar operation.');
        error.status = response.status; throw error;
      }
      const text = await response.text(); return text ? JSON.parse(text) : null;
    };
    if (input.action === 'status') {
      const calendar = await graph('/me/calendar?$select=name,canEdit');
      return Response.json({ connected: true, calendar: { name: calendar.name, canEdit: calendar.canEdit } });
    }
    if (input.action === 'list') {
      const start = Date.parse(input.start), end = Date.parse(input.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 62 * 86400000) return Response.json({ error: 'Choose a calendar range of up to 62 days.' }, { status: 400 });
      const params = new URLSearchParams({ startDateTime: input.start, endDateTime: input.end, '$top': '50', '$orderby': 'start/dateTime', '$select': fields });
      let path = `/me/calendarView?${params}`;
      if (input.cursor) {
        let url;
        try { url = new URL(input.cursor); } catch { return Response.json({ error: 'Invalid calendar page.' }, { status: 400 }); }
        if (url.origin !== 'https://graph.microsoft.com' || url.pathname !== '/v1.0/me/calendarView' || url.username || url.password || url.hash || url.searchParams.get('startDateTime') !== input.start || url.searchParams.get('endDateTime') !== input.end || url.searchParams.get('$top') !== '50' || url.searchParams.get('$select') !== fields) return Response.json({ error: 'Invalid calendar page.' }, { status: 400 });
        path = url.pathname.slice('/v1.0'.length) + url.search;
      }
      const page = await graph(path);
      return Response.json({ events: page.value || [], next_cursor: page['@odata.nextLink'] || null });
    }
    let eventPath, existing;
    if (input.action !== 'create') {
      if (typeof input.id !== 'string' || !input.id || input.id.length > 1500) return Response.json({ error: 'Choose an event.' }, { status: 400 });
      eventPath = `/me/events/${encodeURIComponent(input.id)}`;
      existing = await graph(`${eventPath}?$select=${fields},body`);
      if (input.action === 'get') return Response.json({ event: existing });
      if (!existing.isOrganizer) return Response.json({ error: 'Only meetings you organise can be edited or deleted here.' }, { status: 403 });
      if (existing.type === 'seriesMaster') return Response.json({ error: 'Manage an entire recurring series in Outlook.' }, { status: 400 });
    }
    if (input.action === 'delete') { await graph(eventPath, 'DELETE'); return Response.json({ ok: true }); }
    const event = input.event;
    const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) && Number.isFinite(Date.parse(value));
    if (!event || typeof event.subject !== 'string' || !event.subject.trim() || event.subject.length > 200 || !validDate(event.start) || !validDate(event.end) || event.end <= event.start || typeof event.isAllDay !== 'boolean' || typeof event.location !== 'string' || event.location.length > 300 || typeof event.description !== 'string' || event.description.length > 5000 || !Array.isArray(event.attendees) || event.attendees.length > 30 || event.attendees.some(email => typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return Response.json({ error: 'Check the event title, dates and attendee email addresses.' }, { status: 400 });
    if (event.isAllDay && (!event.start.endsWith('T00:00:00') || !event.end.endsWith('T00:00:00'))) return Response.json({ error: 'All-day events must start and end at midnight.' }, { status: 400 });
    const body = { subject: event.subject.trim(), start: { dateTime: event.start, timeZone }, end: { dateTime: event.end, timeZone }, isAllDay: event.isAllDay, location: { displayName: event.location.trim() }, body: { contentType: 'text', content: event.description }, attendees: event.attendees.map(address => ({ emailAddress: { address }, type: existing?.attendees?.find(person => person.emailAddress?.address?.toLowerCase() === address.toLowerCase())?.type || 'required' })) };
    if (event.isOnlineMeeting !== undefined && typeof event.isOnlineMeeting !== 'boolean') return Response.json({ error: 'Invalid Teams meeting setting.' }, { status: 400 });
    if (existing?.isOnlineMeeting && event.isOnlineMeeting === false) return Response.json({ error: 'An existing online meeting cannot be changed to offline.' }, { status: 400 });
    if (event.isOnlineMeeting && !existing?.isOnlineMeeting) {
      const calendar = await graph('/me/calendar?$select=allowedOnlineMeetingProviders');
      if (!calendar.allowedOnlineMeetingProviders?.includes('teamsForBusiness')) return Response.json({ error: 'Your Outlook calendar does not support Teams meetings. Ask IT to check your Microsoft 365 licence.' }, { status: 400 });
      body.isOnlineMeeting = true; body.onlineMeetingProvider = 'teamsForBusiness';
    }
    if (input.action === 'create') {
      if (typeof input.requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.requestId)) return Response.json({ error: 'Invalid event request.' }, { status: 400 });
      body.transactionId = input.requestId;
    }
    const saved = await graph(input.action === 'create' ? '/me/events' : eventPath, input.action === 'create' ? 'POST' : 'PATCH', body);
    return Response.json({ event: saved });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to access Outlook.', ...(error.status === 401 ? { code: 'OUTLOOK_NOT_CONNECTED' } : {}) }, { status: error.status === 401 ? 409 : error.status === 403 ? 403 : 500 });
  }
}