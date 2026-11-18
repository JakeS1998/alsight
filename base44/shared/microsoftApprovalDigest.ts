import { microsoftApprovalContext } from './microsoftApprovalContext.ts';
import { microsoftPendingApprovalPage } from './microsoftApprovalReads.ts';
import { flowRequest } from './dataverseFlowApi.ts';

const digestRowLimit = 10;
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
  const listed = [...approvals.values()].slice(0, digestRowLimit);
  const cells = {};
  for (let i = 0; i < digestRowLimit; i++) {
    const approval = listed[i], row = `row_${i + 1}`;
    const due = new Date(approval?.dueAt ?? NaN);
    cells[`${row}_title`] = approval?.title.slice(0, 250).replace(/\u2014/g, ', ') ?? '';
    cells[`${row}_due`] = !approval ? '' : Number.isFinite(due.getTime()) && due.getUTCFullYear() < 9999 ? dateLabel.format(due) : 'No due date';
    cells[`${row}_display`] = approval ? 'table-row' : 'none';
  }
  return { count: approvals.size, variables: {
    summary: `${more ? 'At least ' : ''}${approvals.size} ${approvals.size === 1 ? 'approval is' : 'approvals are'} assigned to you and awaiting your decision.`,
    ...cells,
    more: more || approvals.size > digestRowLimit ? `Showing the first ${digestRowLimit} approvals. Open the Approval Centre to see the full list.` : '',
    approval_url: 'https://als-hub.base44.app/approvals',
  } };
}