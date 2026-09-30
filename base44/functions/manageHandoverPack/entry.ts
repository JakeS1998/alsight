import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { handoverDefinitions, loadHandover, safeReference } from '../../shared/handoverDataset.ts';
import { createHandoverReport } from '../../shared/handoverReport.ts';
import { createHandoverBundle } from '../../shared/handoverBundle.ts';
import { withPortalUserNames } from '../../shared/portalUserNames.ts';
import { handoverRegisters } from '../../shared/handoverRegisters.ts';
import { readHandoverRegister, saveHandoverRegister, hydrateHandoverRegisters } from '../../shared/handoverRegisterStorage.ts';
import { createHandoverRegisterPdf } from '../../shared/handoverRegisterPdf.ts';

const internal = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'];
const editors = ['admin', 'director', 'bsm', 'bdm'];
const failure = (error, status = 400) => Response.json({ error }, { status });
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user || !internal.includes(user.role)) return failure('Internal project-team access required.', 403);
    const input = await req.json();
    if (typeof input.projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.projectId) || !['read','start','review','attach','supersede','applicability','export','register','save_register','export_register'].includes(input.action)) return failure('Choose a project and handover action.');
    const project = await base44.entities.Project.get(input.projectId);
    if (!project || project.status === 'inactive') return failure('Project not accessible.', 403);
    const page = await base44.entities.ProjectDelivery.filter({ project_id: project.id }, { sort: '-created_date', limit: 1 });
    let delivery = page.items[0] || { project_id: project.id };
    if (input.action === 'read') return Response.json({ pack: delivery.handover_started_at ? await loadHandover(base44, project, delivery) : { started: false } });
    if (input.action === 'register' || input.action === 'export_register') {
      if (!delivery.handover_started_at || !Object.hasOwn(handoverRegisters, input.key)) return failure('Start handover and choose a supported register.');
      const item = (delivery.handover_items || []).find(row => row.key === input.key) || { key: input.key };
      const register = await readHandoverRegister(base44, item, secrets.get('BASE44_APP_ID'));
      if (input.action === 'register') return Response.json({ config: handoverRegisters[input.key], register });
      if (!item.register_file_uri) return failure('Save the register before downloading.');
      const bytes = createHandoverRegisterPdf(project, { ...item, registerData: register });
      let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return Response.json({ content: btoa(binary), mime: 'application/pdf', filename: `Handover-${input.key}-v${item.register_version}.pdf` });
    }
    if (input.action === 'export') {
      if (!delivery.handover_started_at || !['pdf','zip'].includes(input.format)) return failure('Start handover and choose PDF or ZIP.');
      const pack = await hydrateHandoverRegisters(base44, await loadHandover(base44, project, delivery), secrets.get('BASE44_APP_ID'));
      const bytes = input.format === 'zip' ? await createHandoverBundle(base44, pack, secrets.get('BASE44_APP_ID')) : createHandoverReport(pack);
      let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return Response.json({ content: btoa(binary), mime: input.format === 'zip' ? 'application/zip' : 'application/pdf', filename: `Handover-${String(project.project_number || project.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)}.${input.format}` });
    }
    if (!editors.includes(user.role)) return failure('Your role can view packs but cannot edit them.', 403);
    const [namedUser] = await withPortalUserNames(base44.entities, [user]);
    const now = new Date().toISOString(), actor = namedUser.full_name || user.email;
    const audit = [...(delivery.handover_audit || [])];
    if (audit.length >= 500) return failure('Handover change-history limit reached. Contact your administrator.');
    const changes = {};
    if (input.action === 'start') {
      if (delivery.handover_started_at) return Response.json({ pack: await loadHandover(base44, project, delivery) });
      changes.handover_started_at = now; changes.handover_started_by = actor; changes.handover_applicability = 'not_assessed';
      audit.push({ at: now, actor, action: 'Handover started' });
    } else {
      if (!delivery.handover_started_at) return failure('Start handover first.');
      if (input.action === 'applicability') {
        if (!['not_assessed','applies','does_not_apply'].includes(input.value)) return failure('Choose golden-thread applicability.');
        changes.handover_applicability = input.value;
        audit.push({ at: now, actor, action: 'Applicability updated', detail: `${delivery.handover_applicability || 'not_assessed'} -> ${input.value}` });
      } else {
        if (!handoverDefinitions.some(item => item.key === input.key)) return failure('Unknown handover item.');
        const items = [...(delivery.handover_items || [])];
        let index = items.findIndex(item => item.key === input.key);
        if (index < 0) { items.push({ key: input.key, documents: [] }); index = items.length - 1; }
        const item = { ...items[index], documents: [...(items[index].documents || [])] };
        if (input.action === 'review') {
          if (!['automatic','outstanding','partial','complete'].includes(input.status) || typeof input.notes !== 'string' || input.notes.length > 3000 || typeof input.link !== 'string' || input.link.length > 1000 || (input.link.trim() && !safeReference(input.link))) return failure('Use a valid review status, notes and HTTPS document link.');
          if (input.link.trim().startsWith('mp/private/') && !input.link.trim().startsWith(`mp/private/${secrets.get('BASE44_APP_ID')}/`)) return failure('The document must belong to this app.');
          audit.push({ at: now, actor, action: 'Item reviewed', key: input.key, detail: JSON.stringify({ before: { status: item.review_status, notes: item.notes, link: item.link }, after: { status: input.status, notes: input.notes.trim(), link: input.link.trim() } }).slice(0, 6500) });
          Object.assign(item, { review_status: input.status, notes: input.notes.trim(), link: input.link.trim(), reviewed_at: now, reviewed_by: actor });
        } else if (input.action === 'save_register') {
          const previous = item.register_file_uri || '';
          await saveHandoverRegister(base44, item, input.register, actor, now);
          audit.push({ at: now, actor, action: 'Portal register saved', key: input.key, detail: `Version ${item.register_version} | ${item.register_count} entries | Previous archive: ${previous || 'None'}` });
        } else if (input.action === 'attach') {
          if (typeof input.file_uri !== 'string' || !input.file_uri.startsWith(`mp/private/${secrets.get('BASE44_APP_ID')}/`) || input.file_uri.length > 500 || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160 || !/\.(pdf|docx|xlsx|csv|txt|png|jpe?g|dwg|dxf)$/i.test(input.name) || !Number.isFinite(input.size) || input.size <= 0 || input.size > 10 * 1024 * 1024 || typeof input.version !== 'string' || !input.version.trim() || input.version.length > 40) return failure('Upload a supported document (up to 10 MB) and record its version.');
          if (item.documents.length >= 20) return failure('Maximum 20 document versions per handover category.');
          item.documents.push({ id: crypto.randomUUID(), file_uri: input.file_uri, name: input.name.trim(), size: input.size, version: input.version.trim(), actor, at: now, superseded: false });
          audit.push({ at: now, actor, action: 'Document uploaded', key: input.key, detail: `${input.name} | Version ${input.version}` });
        } else if (input.action === 'supersede') {
          const file = item.documents.find(doc => doc.id === input.documentId);
          if (!file || file.superseded) return failure('Choose a current uploaded document.');
          file.superseded = true;
          audit.push({ at: now, actor, action: 'Document superseded', key: input.key, detail: `${file.name} | Version ${file.version}` });
        }
        items[index] = item; changes.handover_items = items;
      }
    }
    changes.handover_audit = audit;
    delivery = delivery.id ? await base44.entities.ProjectDelivery.update(delivery.id, changes) : await base44.entities.ProjectDelivery.create({ project_id: project.id, client_account_id: project.client_account_id || '', bdm_aad_id: project.bdm_aad_id || '', ...changes });
    return Response.json({ pack: await loadHandover(base44, project, delivery) });
  } catch (error) { console.error('Handover action failed', error); return failure(error.message || 'Unable to update the handover pack.', 500); }
}