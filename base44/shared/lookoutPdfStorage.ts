import { makeLookoutPdf } from './lookoutPdf.ts';
export async function storeLookoutPdf(base44, issue, draft = false) {
  const bytes = await makeLookoutPdf(issue, draft);
  const file = new File([bytes], `The-Lookout-${String(issue.issue_number).padStart(3,'0')}-${issue.publication_date}${draft ? '-draft' : ''}.pdf`, {type:'application/pdf'});
  const {file_uri} = await base44.asServiceRole.integrations.Core.UploadPrivateFile({file});
  return file_uri;
}
export async function storeLookoutDraft(base44, issue) {
  const file_uri = await storeLookoutPdf(base44, issue, true);
  await base44.entities.LookoutIssue.updateMany({id:issue.id,status:'draft',revision:issue.revision},{$set:{draft_pdf_file_uri:file_uri}});
  return await base44.entities.LookoutIssue.get(issue.id);
}