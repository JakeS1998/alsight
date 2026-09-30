import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { bdmRequestDefaults } from '../../shared/bdmRequestDefaults.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const payload = await req.json();
    if (payload.action === 'request_defaults') {
      if (!['admin', 'director', 'bdm'].includes(user.role)) return Response.json({ error: 'Project request access required' }, { status: 403 });
      if (typeof payload.bdmId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(payload.bdmId)) return Response.json({ error: 'Invalid BDM' }, { status: 400 });
      return Response.json(await bdmRequestDefaults(base44, payload.bdmId));
    }
    const { projectId } = payload;
    if (typeof projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(projectId))
      return Response.json({ error: 'Invalid project' }, { status: 400 });
    const project = await base44.entities.Project.get(projectId).catch(() => null);
    if (!project) return Response.json({ error: 'Project not available' }, { status: 404 });
    if (!project.bdm_aad_id) return Response.json({ managerName: '' });
    const lines = await base44.asServiceRole.entities.StaffReportingLine.filter({ staff_aad_id: project.bdm_aad_id, source_matched: true }, '-created_date', 1);
    return Response.json({ managerName: lines[0]?.manager_name || '' });
  } catch (error) {
    console.error('Unable to resolve BDM manager', error);
    return Response.json({ error: 'Unable to load BDM manager' }, { status: 500 });
  }
}