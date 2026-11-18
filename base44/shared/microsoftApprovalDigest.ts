import { microsoftApprovalContext } from './microsoftApprovalContext.ts';
import { microsoftPendingApprovalPage } from './microsoftApprovalReads.ts';
import { flowRequest } from './dataverseFlowApi.ts';

const escape = value => String(value).replace(/\u2014/g, ', ').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/London', day:'numeric', month:'short', year:'numeric' });
export const formatDigestDay = () => new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/London', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
export const digestAddress = value => String(value || '').trim().toLowerCase();

export async function microsoftApprovalDigest(base44, recipient) {
  const context = await microsoftApprovalContext(base44, recipient);
  if (!context.connected) return null;
  const account = await flowRequest(context.environment, context.token, `systemusers(${context.userId})?$select=internalemailaddress,isdisabled`);
  if (account.isdisabled !== false || digestAddress(account.internalemailaddress) !== digestAddress(recipient.email)) return null;
  const approvals = new Map();
  let more = false;
  for (let page = 1; page <= 4; page++) {
    const result = await microsoftPendingApprovalPage(context, page);
    for (const approval of result.items) if (approval.id) approvals.set(approval.id, approval);
    more = result.hasMore;
    if (!more) break;
  }
  if (!approvals.size) return null;
  const approvalItems = [...approvals.values()].map(approval => {
    const title = escape(approval.title.slice(0, 250));
    const due = Number.isFinite(Date.parse(approval.dueAt)) ? ` <span style="color:#5f7586;">(due ${dateLabel.format(new Date(approval.dueAt))})</span>` : '';
    return `<li style="padding:4px 0;">${title}${due}</li>`;
  }).join('');
  return { count: approvals.size, variables: {
    summary: `${more ? 'At least ' : ''}${approvals.size} ${approvals.size === 1 ? 'approval is' : 'approvals are'} assigned to you and awaiting your decision.`,
    approval_items: `<ul style="margin:0;padding-left:20px;">${approvalItems}</ul>`,
    more: more ? 'Open the Approval Centre to see the rest of your outstanding approvals.' : '',
    approval_url: 'https://als-hub.base44.app/approvals',
  } };
}