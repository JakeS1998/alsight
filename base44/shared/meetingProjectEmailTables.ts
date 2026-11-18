export const escapeMeetingEmailText=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('{','&#123;').replaceAll('}','&#125;');
const labels={meeting_note:'Note',project_comment:'Comment',meeting_action:'Action added',meeting_completed:'Action completed'};
const renderText=value=>escapeMeetingEmailText(value).replace(/\r\n|\r|\n/g,'<br />');
function projectTable(name,rows){
 const cell='padding:8px 10px;border:1px solid #e5e7eb;vertical-align:top;overflow-wrap:anywhere;word-wrap:break-word;';
 return `<h2 style="margin:0 0 8px;color:#102642;font-size:17px;line-height:1.3;">${renderText(name)}</h2><table width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 20px;color:#102642;font-size:13px;line-height:1.45;text-align:left;"><thead><tr style="background-color:#eaf4fb;"><th scope="col" width="29%" style="${cell}">Type</th><th scope="col" style="${cell}">Update</th></tr></thead><tbody>${rows.map(({kind,text})=>`<tr><td style="${cell}">${labels[kind]}</td><td style="${cell}">${renderText(text)}</td></tr>`).join('')}</tbody></table>`;
}
export async function meetingProjectEmailTables(db,session,recipientIds){
 const groups=new Map(),limit=100;
 let cursor=null,shortened=false,count=0,bytes=0;
 const scope={key_points:session.key_points,next_action:{$in:Object.keys(labels)},project_id:{$exists:true,$nin:['',null]}};
 do {
  const page=await db.CRMActivity.filter(scope,{sort:'occurred_at',limit:50,fields:['project_id','subject','description','next_action','meeting_member_ids','owner_id'],...(cursor ? {cursor} : {})});
  for(const row of page.items){
   // Only include updates shared with the entire mailing list, never host-only records.
   if(!recipientIds.every(id=>row.owner_id===id || row.meeting_member_ids?.includes(id)))continue;
   const description=typeof row.description==='string' ? row.description.trim() : '';
   if(!description)continue;
   const noteName=row.subject?.match(/^(?:Project meeting note|Project comment) · (.+)$/)?.[1];
   const prefix=description.indexOf(': ');
   const name=noteName || (row.next_action.startsWith('meeting_') && row.next_action!=='meeting_note' && prefix>0 ? description.slice(0,prefix) : '');
   const group=groups.get(row.project_id) || {name,rows:[]};
   if(!group.name && name)group.name=name;
   const text=description.startsWith(`${name}: `) && row.next_action!=='meeting_note' && row.next_action!=='project_comment' ? description.slice(name.length+2) : description;
   const size=new TextEncoder().encode(renderText(text)).length+350+(groups.has(row.project_id) ? 0 : 1000);
   if(bytes+size>64000 || count>=limit){shortened=true;break;}
   bytes+=size;count++;
   group.rows.push({kind:row.next_action,text});groups.set(row.project_id,group);
  }
  cursor=page.has_more ? page.next_cursor : null;
 }while(cursor && !shortened);
 const ids=[...groups.keys()];
 const names=ids.length ? (await db.Project.filter({id:{$in:ids}},{limit:100,fields:['name']})).items : [];
 for(const project of names){const group=groups.get(project.id);if(group && project.name)group.name=project.name;}
 const body=[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'en-GB')).map(group=>projectTable(group.name || 'Project',group.rows)).join('');
 const notice=shortened ? '<p style="color:#5f7586;">This email shows part of the meeting record. Open the meeting notes for all updates.</p>' : '';
 return body+notice || '<p style="margin:0;color:#5f7586;">No project notes or actions were recorded for everyone in this session.</p>';
}