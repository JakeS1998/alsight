# Planned Dataverse document approvals through Power Automate

Saved: 8 October 2026. Intended next session: 9 October 2026.
Status: approval-centre foundation implemented on 8 October 2026; external delivery and decision/write-back flows remain inactive.

## User requirements
- A document's drafted-date change in Dataverse should start an approval in ALSight without waiting for the regular Dataverse synchronisation schedule.
- Users review and decide the approval inside ALSight, not through native Microsoft Approvals.
- Power Automate should write the approval result back to the original Dataverse row.
- Use Power Automate rather than manually registering a Dataverse webhook.

## Proposed round trip
1. A Power Automate Dataverse row-modified trigger watches the selected document table and drafted-date column.
2. Check for an actual date change, not merely the column appearing in an update; prevent repeated requests for the same event/version.
3. Send an authenticated request to a narrow ALSight receiver containing the source table, document GUID, change/version identification, and required approval context.
4. ALSight creates the document approval, assigns the authorised approver, and provides an in-app review and decision flow.
5. ALSight sends the completed decision to a separate authenticated Power Automate flow.
6. That flow checks the request/version still applies and writes the result, approver, decision date, and comments to the original Dataverse row.
7. Keep the ALSight display consistent with confirmed Dataverse results.

## Required safeguards
- Authenticate incoming requests and outgoing callbacks; store credentials securely, never in frontend code or this document.
- Validate allowed tables, records, fields, and approver permissions.
- Correlate requests and responses using stable approval/request identifiers and document versions.
- Prevent duplicate approvals and duplicate result processing.
- Reject or supersede outdated approvals when the relevant document version changes.
- Filter the source trigger to the drafted-date column so result write-back does not restart it.
- Track write-back status and provide bounded retries/recovery without losing the decision.
- Preserve existing risk-register approval functionality and the regular Dataverse sync.
- Event-driven Power Automate delivery is near-real-time, not guaranteed synchronous or zero-delay.

## Confirm before implementation
- Which document table(s) and mapped Dataverse drafted-date column(s) are included.
- Whether blank-to-date, date-to-date, and date-to-blank changes all trigger approval.
- Who approves each document, and whether multiple approvals are required.
- What immutable document/version evidence the approver reviews; a mutable file link alone is not a fixed snapshot.
- Destination Dataverse result columns and their status/choice mappings.
- What to do with an existing pending or completed approval after another change.
- Power Automate ownership, licensing, permitted connections, and authentication for both directions.
- Reliable actual-change detection and out-of-order/concurrent-event handling.

## Implementation boundary
Implemented foundation: ApprovalAccess entity with administrator-only grants; Approval access checkbox in each person's Portal Account; a server-checked assigned inbox at /approvals, visible only to enabled users; DocumentApprovalRequest entity with direct access restricted to administrators; manageApprovalCentre authenticates callers and scopes reads to the assigned portal email. Administration links to a 12-step setup guide at /admin/approvals. No approval access is enabled by default, including for administrators. Invited people can be granted access before signing in, using their portal email.

Not yet implemented: authenticated Power Automate receiver, document-version capture, reviewer decision controls, actual-change detection, idempotent ingestion, callbacks, delivery acknowledgements/retries, or external Power Automate configuration. The inbox explicitly identifies this stage and does not claim Dataverse write-back is live. Existing manageRiskApprovals supports risk-register approvals and remains unchanged. Confirm the first document table, approver routing and fixed-version review requirements before building the next stage; request missing integration secrets before writing secret-dependent functions.

Use https://alsight.base44.app/functions/<functionName> for an ALSight receiver URL registered in Power Automate, after the actual function is created. No endpoint name or external flow URL has been selected yet.