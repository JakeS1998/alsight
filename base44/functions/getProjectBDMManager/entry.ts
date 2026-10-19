import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { bdmRequestDefaults } from '../../shared/bdmRequestDefaults.ts';
import { resolveStaffReportingLine } from '../../shared/staffReportingIdentity.ts';
import { projectAssignedStaff } from '../../shared/projectAssignedStaff.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !await base44.auth.isAuthenticated()) return Response.json({ error: 'Sign in required' }, { status: 401 });
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
    if (payload.action === 'staff_names') {
      if (user.role === 'supplier') return Response.json({ error: 'Staff names not available' }, { status: 403 });
      const { names, links } = await projectAssignedStaff(base44, [project.bdm_aad_id, project.bsm_aad_id, project.director_aad_id]);
      return Response.json({ names, links });
    }
    if (project.director_aad_id) {
      const { names, links } = await projectAssignedStaff(base44, [project.director_aad_id]);
      if (names[project.director_aad_id]) return Response.json({ managerName: names[project.director_aad_id], managerContactId: links[project.director_aad_id]?.split('/').pop() });
    }
    if (!project.bdm_aad_id) return Response.json({ managerName: '' });
    let line = await resolveStaffReportingLine(base44.asServiceRole.entities, project.bdm_aad_id);
    if (!line?.manager_name) {
      const resolved = await projectAssignedStaff(base44, [project.bdm_aad_id], project.bdm_aad_id);
      line = { ...line, manager_name: resolved.managerName, manager_aad_id: resolved.managerId };
    }
    let managerContactId;
    if(line?.manager_email||line?.manager_aad_id){
      const rules=[];
      if(line.manager_email)rules.push({email:{$regex:`^${line.manager_email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,$options:'i'}});
      if(line.manager_aad_id)rules.push({aad_id:line.manager_aad_id},{dataverse_id:line.manager_aad_id});
      const contacts=await base44.entities.Contact.filter({$or:rules},{limit:2,fields:['full_name']});
      if(contacts.items.length===1)managerContactId=contacts.items[0].id;
    }
    return Response.json({ managerName: line?.manager_name || '',managerContactId });
  } catch (error) {
    console.error('Unable to resolve BDM manager', error);
    const rateLimited = Number(error?.response?.status || error?.status) === 429 || /rate limit|too many requests/i.test(error?.message || '');
    return Response.json({ error: rateLimited ? 'Rate limit exceeded' : 'Unable to load BDM manager' }, { status: rateLimited ? 429 : 500 });
  }
}