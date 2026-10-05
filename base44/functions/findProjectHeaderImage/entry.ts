import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { searchHeaderPhoto } from '../../shared/searchHeaderPhoto.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const { projectId } = await req.json();
    if (typeof projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(projectId)) {
      return Response.json({ error: 'Invalid project reference' }, { status: 400 });
    }
    // Reuse supplier access checks; all other callers must be able to read the project through RLS.
    const project = user.role === 'supplier'
      ? (await base44.functions.invoke('supplierProjectAccess', { action: 'project', projectId })).data?.project
      : await base44.entities.Project.get(projectId).catch(() => null);
    if (!project) return Response.json({ error: 'Project not available' }, { status: 403 });
    const name = String(project.name || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(refurbishment|refurb|redevelopment|renovation|extension|upgrade)\b.*$/i, '').replace(/["\r\n]/g, ' ').trim().slice(0, 160);
    if (!name) return Response.json({ url: null });
    const venueName = /\b(leisure|sports?|swimming|pool|baths?|lido|gym|fitness|spa|arena|stadium|golf|tennis|aquatic)\b/i.test(name) ? name : `${name} Leisure Centre`;
    const postcode = String(project.site_postcode || '').trim().toUpperCase();
    let location = '';
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(postcode)) {
      const postcodeData = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, { signal: AbortSignal.timeout(5000) })
        .then(response => response.ok ? response.json() : null).catch(() => null);
      location = postcodeData?.result?.admin_district || postcodeData?.result?.region || postcode.replace(/\s*\d[A-Z]{2}$/, '');
    }
    const result = await searchHeaderPhoto(`"${venueName}" ${location}`.trim(), `${venueName} project photograph`);
    return Response.json(result.body, { status: result.status });
  } catch {
    // Never include provider request URLs or credentials in errors or logs.
    return Response.json({ error: 'Unable to find a project photograph' }, { status: 500 });
  }
}