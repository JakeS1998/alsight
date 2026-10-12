# Dataverse sync permission trial, 12 October 2026

Rollback baseline: git commit 8fafa0790645d8b5bd96efe2c7729345dddaaaf6. The working tree was clean immediately before this trial.

Reported issue: `Permission denied for list operation on User entity` when manually syncing as jake@allianceleisure.co.uk. That portal account was checked and has role `admin`. The automatic pass recorded successful completion at 09:17 London time. The precise reason that the session-level User permission check denied access is not established.

Trial scope: administrator-only operations in manageDataverseFlow used service-role User reads (filter/list/get) after the existing authentication and admin-role checks. User writes, other entity access, personal record editing, Dataverse credentials, mappings, workflows and checkpoints were unchanged.

Outcome: the System users backend trial processed 50 source records and queued 50 for review, but the user subsequently reported the same User-list permission error on the Documents table. The System users trial did not verify Documents sync. On 12 October 2026 the trial was reverted as agreed: manageDataverseFlow restored to its baseline and dataverseAdminUserReads.ts removed. Approval-routing and requester resolution are separate User-read paths used by Documents sync and already use service-role entities; the wrapper trial did not change these paths. No replacement permission changes have been applied. The source of the remaining denial is not yet established.

To revert just this trial without undoing subsequent work:
1. Remove the import of dataverseAdminUserReads from base44/functions/manageDataverseFlow/entry.ts.
2. Change `let base44 = createClientFromRequest(req), user = await base44.auth.me();` back to `const base44 = createClientFromRequest(req), user = await base44.auth.me();`.
3. Remove `if (adminActions.includes(input.action)) base44 = dataverseAdminUserReads(base44, user);` immediately after the existing admin-action permission check.
4. Delete base44/shared/dataverseAdminUserReads.ts.

Do not revert other changes or any synced records. This trial does not alter login roles or connector permissions.