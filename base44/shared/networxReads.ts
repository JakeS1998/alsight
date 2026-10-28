import { flowRequest } from './dataverseFlowApi.ts';
import { networxQuery } from './networxQueries.ts';
import { networxStatuses } from './networxStatuses.ts';
import { decodeNetworxCursor, encodeNetworxCursor } from './networxCursor.ts';
import { networxActivityMetadata, networxMeetingLink } from './networxActivityMetadata.ts';
import {networxActivityRow as activityRow,networxRowLabel as label} from './networxActivityRow.ts';
import networxEmailThreadRead from './networxEmailThreadRead.ts';
const options = {headers:{Prefer:'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}};
export async function readNetworxActivities(context, input) {
  const {environment, token, sourceId} = context;
  if (input.action==='thread') return networxEmailThreadRead(context,input);
  if (input.action === 'detail') {
    const note = input.kind === 'annotation';
    const page = await flowRequest(environment,token,networxQuery(sourceId,input,note),options);
    const row = page.value?.[0];
    if (!row) return {state:'not_found', message:'This activity is no longer available to your Dataverse account.'};
    const [item] = await networxStatuses(context,[activityRow(row,note)]);
    const metadata=input.kind==='appointment' ? networxActivityMetadata(row.description) : null;
    return {state:'ready', item:{...item, joinUrl:networxMeetingLink(metadata?.joinUrl,true),outlookUrl:networxMeetingLink(metadata?.webLink),body:(note ? row.notetext : row.description) || '', participants:(row.activitypointer_activity_parties || []).map(p=>({name:label(p,'_partyid_value') || p.addressused || 'Unnamed participant', role:label(p,'participationtypemask')}))}};
  }
  // Retain only native continuation addresses and unread IDs, not private content.
  // Re-read buffered IDs under today's permissions and relationship links on every page.
  const streams = input.cursor ? await decodeNetworxCursor(context,input.cursor) : [false,true].map(note=>({note,pendingIds:[],next:networxQuery(sourceId,input,note)}));
  if(!Array.isArray(streams))throw Object.assign(new Error('Refresh the activity timeline before loading more.'),{status:400});
  await Promise.all(streams.map(async stream=>{
    const buffered = stream.pendingIds.length > 0;
    stream.rows = [];
    if (!buffered && !stream.next) return;
    const path = buffered ? networxQuery(sourceId,input,stream.note,stream.pendingIds) : stream.next;
    const page = await flowRequest(environment,token,path,{headers:{Prefer:`odata.maxpagesize=${buffered ? 50 : 20},odata.include-annotations="OData.Community.Display.V1.FormattedValue"`}});
    stream.rows = (page.value || []).map(row=>activityRow(row,stream.note));
    if (!buffered) stream.next = page['@odata.nextLink'] || null;
    // Each source must offer at least 20 candidates (or be exhausted) so that
    // older notes cannot jump ahead of an unfetched page of newer activities.
    while (stream.rows.length < 20 && stream.next) {
      const next = await flowRequest(environment,token,stream.next,{headers:{Prefer:'odata.maxpagesize=20,odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});
      stream.rows.push(...(next.value || []).map(row=>activityRow(row,stream.note)));
      stream.next = next['@odata.nextLink'] || null;
    }
  }));
  const rows = streams.flatMap(stream=>stream.rows).sort((a,b)=>Date.parse(b.updated)-Date.parse(a.updated) || b.id.localeCompare(a.id) || b.kind.localeCompare(a.kind));
  const items = rows.slice(0,20), consumed = new Set(items.map(row=>`${row.kind}:${row.id}`));
  const state = streams.map(stream=>({note:stream.note,next:stream.next,pendingIds:stream.rows.filter(row=>!consumed.has(`${row.kind}:${row.id}`)).map(row=>row.id)}));
  const hasMore = state.some(stream=>stream.pendingIds.length || stream.next);
  return {state:'ready',items:await networxStatuses(context,items),nextCursor:hasMore ? await encodeNetworxCursor(context,state) : null};
}