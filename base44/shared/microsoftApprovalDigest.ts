import { microsoftApprovalContext } from './microsoftApprovalContext.ts';
import { microsoftPendingApprovalPage } from './microsoftApprovalReads.ts';
import { flowRequest } from './dataverseFlowApi.ts';
import { microsoftApprovalDigestRecords } from './microsoftApprovalDigestRecords.ts';

const digestRowLimit = 10;
const cellText = value => String(value || '').replace(/\u2014/g, ', ').slice(0, 250);
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
  const listed = await microsoftApprovalDigestRecords(base44.asServiceRole.entities, recipient, [...approvals.values()].slice(0, digestRowLimit));
  const cells = {};
  for (let i = 0; i < digestRowLimit; i++) {
    const approval = listed[i], row = `row_${i + 1}`;
    cells[`${row}_project`] = cellText(approval?.project);
    cells[`${row}_type`] = cellText(approval?.type);
    cells[`${row}_requestor`] = cellText(approval?.requestor);
    cells[`${row}_hub`] = approval?.hubUrl || '';
    cells[`${row}_hub_label`] = approval ? (approval.hubUrl ? 'Hub record' : 'Unavailable') : '';
    cells[`${row}_approval`] = approval?.approvalUrl || '';
    cells[`${row}_display`] = approval ? 'table-row' : 'none';
  }
  return { count: approvals.size, variables: {
    summary: `${more ? 'At least ' : ''}${approvals.size} ${approvals.size === 1 ? 'approval is' : 'approvals are'} assigned to you and awaiting your decision.`,
    ...cells,
    more: more || approvals.size > digestRowLimit ? `Showing the first ${digestRowLimit} approvals. Open the Approval Centre to see the full list.` : '',
    approval_url: 'https://als-hub.base44.app/approvals',
  } };
}