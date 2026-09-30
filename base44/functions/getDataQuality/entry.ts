import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { checks, directQueries } from '../../shared/dataQualityRules.ts';
import { auditProjects, directCheck, duplicateContacts } from '../../shared/dataQualityAudit.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    const body = await req.json();
    if (!['summary', 'issues'].includes(body.action)) return Response.json({ error: 'Invalid quality check action.' }, { status: 400 });
    const db = base44.entities;
    if (body.action === 'summary') {
      const counts = {};
      const projectResults = await auditProjects(db, null);
      for (const [key, result] of Object.entries(projectResults)) counts[key] = result.total;
      for (const key of [...Object.keys(directQueries), 'dataverse']) counts[key] = (await directCheck(db, key)).total;
      counts.duplicates = (await duplicateContacts(db)).total;
      return Response.json({ checks: checks.map(check => ({ ...check, count: counts[check.key] })), checkedAt: new Date().toISOString() });
    }
    const offset = body.offset ?? 0;
    if (!checks.some(check => check.key === body.check) || !Number.isInteger(offset) || offset < 0 || offset > 1000000) return Response.json({ error: 'Invalid quality check or page.' }, { status: 400 });
    const result = body.check === 'duplicates' ? await duplicateContacts(db, offset, true) : body.check === 'dataverse' || directQueries[body.check] ? await directCheck(db, body.check, offset, true) : (await auditProjects(db, body.check, offset))[body.check];
    return Response.json(result);
  } catch (error) {
    console.error('Data quality check failed', error);
    return Response.json({ error: 'Unable to complete data quality checks. Please retry.' }, { status: 500 });
  }
}