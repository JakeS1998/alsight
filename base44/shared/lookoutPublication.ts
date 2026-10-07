import { isReleaseDue } from './lookoutDates.ts';
export async function publishLookout(base44, issue, user) {
  const db=base44.entities;
  if(!isReleaseDue(issue)) throw new Error('Publication is held until Thursday at 1pm UK time.');
  if(!['approved','publishing','published'].includes(issue.status) || !issue.pdf_file_uri || issue.approved_revision!==issue.revision) throw new Error('This issue requires administrator approval before publication.');
  if(issue.status==='approved') {
    const claim=await db.LookoutIssue.updateMany({id:issue.id,status:'approved',revision:issue.revision},{$set:{status:'publishing'}});
    if(!claim.updated) throw new Error('This issue changed or is already being published. Refresh the page.');
  }
  if(issue.status!=='published') {
    const result=await db.AlliancePulseItem.upsert([{
      lookout_issue_id:issue.id,type:'Company Update',title:`THE LOOKOUT · Issue ${String(issue.issue_number).padStart(3,'0')}`,has_heading:true,
      summary:`Your weekly view across Alliance.\nProjects, People & Information Connected\n\n${issue.content.kpis.map(k=>`${k.label}: ${k.value}`).join(' · ')}\n\nRead this week's publication, download the PDF and take part in the quick poll.`,
      related_entity_type:'none',group_id:'',author_id:issue.approved_by || user.id,author_name:'The Lookout',status:'published',is_story:false
    }],{key:'lookout_issue_id'});
    issue=await db.LookoutIssue.update(issue.id,{status:'published',published_at:new Date().toISOString(),pulse_post_id:result.records[0].id});
  }
  const response=await base44.functions.invoke('notifyAlliancePost',{postId:issue.pulse_post_id});
  if(response.data?.error) throw new Error('Issue published, but notifications need retrying: '+response.data.error);
  return issue;
}