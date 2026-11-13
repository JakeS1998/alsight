import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {microsoftSyncPause} from '../../shared/coMicrosoftPause.ts';
import { flowConfig, sharedFlowContext, flowRequest } from '../../shared/dataverseFlowApi.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    const paused=await microsoftSyncPause(base44);if(paused)return Response.json(paused);
    const input=req.method==='POST'?await req.json().catch(()=>({})):{};
    if(input.dry_run===true)return Response.json({dry_run:true,paused:false});
    const { environment, token } = await sharedFlowContext(base44, await flowConfig(base44));
    const positions = await flowRequest(environment, token, 'positions?$select=positionid,name,statecode,_bss_headofdepartment_value&$top=100', { headers: { Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' } });
    if (positions['@odata.nextLink']) return Response.json({ error: 'Region directory exceeds the supported 100 rows; nothing changed.' }, { status: 422 });
    const synced_at = new Date().toISOString();
    const rows = (positions.value || []).map(row => ({ dataverse_id: row.positionid.toLowerCase(), name: row.name.replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim(), source_name: row.name, director_id: row._bss_headofdepartment_value || null, director_name: row['_bss_headofdepartment_value@OData.Community.Display.V1.FormattedValue'] || null, active: row.statecode === 0, source: 'Dataverse position / Head of Department', synced_at }));
    const existing = await base44.entities.RegionDirectory.list({ limit: 100 });
    if (existing.has_more || new Set(existing.items.map(row => row.dataverse_id)).size !== existing.items.length) return Response.json({ error: 'Region directory requires duplicate or pagination review.' }, { status: 409 });
    const byId = new Map(existing.items.map(row => [row.dataverse_id, row.id]));
    const updates = rows.filter(row => byId.has(row.dataverse_id)).map(row => ({ id: byId.get(row.dataverse_id), ...row }));
    const creates = rows.filter(row => !byId.has(row.dataverse_id));
    if (updates.length) await base44.entities.RegionDirectory.bulkUpdate(updates);
    if (creates.length) await base44.entities.RegionDirectory.bulkCreate(creates);
    const absent = existing.items.filter(row => !rows.some(fresh => fresh.dataverse_id === row.dataverse_id));
    if (absent.length) await base44.entities.RegionDirectory.bulkUpdate(absent.map(row => ({ id: row.id, active: false, director_id: null, director_name: null, synced_at })));
    return Response.json({ success: true, synced: rows.length, missing_director: rows.filter(row => !row.director_name).length, synced_at });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}