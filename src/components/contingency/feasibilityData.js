export const architecture=[
 ['Employees and administrators','Existing ALS Hub interface','Protected Contingency routes'],
 ['Base44 authentication','Email/password primary emergency route','Microsoft login remains optional'],
 ['Contingency entities','Replicated records, approvals, changes, logs','RLS and server-side functions'],
 ['Private file storage','Critical document copies and metadata','Signed, time-limited downloads'],
 ['Backend functions','Validation, sync, approvals, reconciliation','Authenticated and role checked'],
 ['Scheduled workflows','Dataverse polling and maintenance','Runs without employee UI'],
 ['Existing Microsoft connections','Dataverse shared-read configuration + SharePoint connector','Sources only; outage copies remain in Base44']
];
export const findings=[
 {area:'Overall Base44-only viability',status:'Conditional',finding:'Suitable for a Microsoft-outage continuity service, provided critical records and files are replicated before the outage.',risk:'It is not independent of Base44. A Base44 outage can remove the interface, authentication, database, functions and file downloads together.'},
 {area:'Database',status:'Confirmed',finding:'Dedicated entities, authenticated API access, RLS, bulk operations, cursors and scheduled writes are available. Tens of thousands of compact records are technically credible with pagination and incremental sync.',risk:'No documented record-count ceiling for this legacy app and no cross-record transactions or unique constraints. Load, recovery and concurrency need PoC tests.'},
 {area:'Database capacity',status:'Requires test',finding:'This app was created 25 September 2026, before the documented 18 October limits; Base44 says the newer plan caps do not apply.',risk:'That is not a contractual unlimited-capacity statement. Confirm a safe operational ceiling with Base44 before production.'},
 {area:'Files',status:'Conditional',finding:'Private Base44 storage supports PDF, TXT, HTML, CSV, XLS, XLSX and JSON up to 50 MB each, signed downloads, and no documented overall file-count/storage cap.',risk:'DOCX is not in the documented live-upload allowlist. Bandwidth, file-backup, versioning and bulk-export guarantees are not documented.'},
 {area:'Dataverse replication',status:'Requires remediation',finding:'The existing shared-read configuration targets the same environment and has 11 mapped tables. A 15-minute scheduled sync already exists.',risk:'The primary connection status is failed; its last check was 8 October 2026. The shared-read check is newer, but must pass again before a PoC.'},
 {area:'SharePoint replication',status:'Confirmed connection',finding:'The SharePoint connector is authorised for site read/write and existing server-side Graph reads are present. Webhook updates are supported.',risk:'Copying files into Base44 private storage and preserving versions/metadata is not yet implemented for Contingency and needs bounded testing.'},
 {area:'Authentication',status:'Conditional',finding:'Email/password and Microsoft login are enabled. Email/password authentication does not require an Entra OAuth sign-in at login.',risk:'MFA is off. Microsoft-first users must establish and test a Base44 password before an incident. Base44 availability and password-reset email remain dependencies.'},
 {area:'Permissions',status:'Requires implementation',finding:'RLS and backend role checks can enforce access below the UI. Contingency duties should use a locked, admin-assigned User field rather than frontend role switching.',risk:'The current demonstration is admin-only and its identity selector is explicitly simulated; it is not production authorisation.'},
 {area:'Activation and recovery',status:'Requires implementation',finding:'Server functions can enforce different approvers, timestamps, state versions, Europe/London time, checklists and employee gating.',risk:'Base44 has no multi-record transaction or unique constraint. Use one versioned incident record, conditional updateMany and idempotency keys; prove races under test.'},
 {area:'Backup and restore',status:'Blocker on current plan',finding:'CSV table export is available and deleted records remain recoverable for 30 days.',risk:'This Pro workspace reports data version history needs an upgrade. Automatic Backup & Restore starts at Elite; files and app users are excluded even there.'},
 {area:'Independent emergency access',status:'Not supported Base44-only',finding:'An external frontend can use Base44 as its backend, and a second Base44 app could be built.',risk:'Neither is independent of Base44. Separate apps do not have documented shared databases, files or user sessions. No Base44-only design can guarantee access during a Base44 outage.'}
];
export const reuse=[
 ['Interface','Existing orange Contingency module, protected route and responsive portal shell'],['Authentication','Platform-managed email/password, Microsoft sign-in, reset flow and optional MFA'],['Database','Entities, RLS, cursor pagination, count/aggregate, bulk create/update and authenticated APIs'],['Files','Private uploads and temporary signed download URLs'],['Integration','Existing Dataverse credentials/shared-read configuration and authorised SharePoint connector'],['Automation','Pro workflows, scheduled triggers, backend functions and resumable batch patterns'],['Reporting','Current PDF/Excel section exports and dashboard components'],['Audit','Dedicated Contingency audit entity and record timestamps']
];
export const dataModel=[
 ['ContingencyOperationalIncident','Versioned activation/recovery state and verified approval identities; separate from the existing personal demo incident'],
 ['ContingencyProject','Project snapshot; source ID/version, provenance and replicated timestamp'],
 ['ContingencyPreConstructionDocument','PQ/access agreement snapshot, project and document version links'],
 ['ContingencyDMA','DMA record, dates, state and source version'],
 ['ContingencyJCT','JCT record and source/project references'],
 ['ContingencyWarranty','Warranty, expiry and project/supplier references'],
 ['ContingencyPSO','PSO snapshot and evidence links'],
 ['ContingencySupplier','Minimal supplier snapshot and source identifiers'],
 ['ContingencySupplierInsurance','Insurance types, validity, approvals and document versions'],
 ['ContingencyEmployee','Minimal emergency directory; source identity is not an authentication account'],
 ['ContingencyCommercialInformation','Approved commercial snapshots separated from source finance entities'],
 ['ContingencyDocumentVersion','Original filename, MIME type, size, private URI, source ETag/version, checksum and project'],
 ['ContingencyEmergencyChange','Employee, incident, UTC time, before/after values, approval and transaction reference'],
 ['ContingencyApproval','Incident stage, verified approver, decision, time and incident revision'],
 ['ContingencySystemHealth','Evidence-backed service checks with checker and checked time'],
 ['ContingencyReplicationLog','Source, cursor/delta checkpoint, job, counts, lag, retries and errors'],
 ['ContingencyRecoveryTransaction','Idempotency key, target/ETag, processing state and verification evidence'],
 ['ContingencyAuditEvent','Application append-only journal; not an immutable external archive'],
 ['ContingencyAnnouncement','Incident-scoped communications and approved audience'],
 ['ContingencyAccessConfig','Locked operator configuration and membership; duties cannot be self-selected']
];
export const poc=[
 ['Gate 1','Re-check the existing Dataverse shared-read path and repair it only if it fails; distinguish its status from the stale primary application check. Confirm exact fictional record IDs and one SharePoint sample folder.'],['Gate 2','Create isolated entities with RLS and locked contingency duty assignments; no production data flow.'],['Gate 3','Build server-side activation and recovery commands using version checks, distinct approvers and Europe/London validation.'],['Gate 4','Run a bounded Dataverse sync for fictional projects/legal records and a SharePoint copy test into private storage.'],['Gate 5','Test employee password login, active/standby access, signed file download, concurrent approvals and duplicate reconciliation.'],['Gate 6','Export PoC tables through the platform and a file manifest plus actual file bytes; restore into a clean approved isolated target, verify links/hashes, measure throughput/credits and obtain production approval. Table/file pointers alone do not pass.']
];
export const costs=[
 ['Current Base44 plan','Pro','Already subscribed; exact subscription price is not exposed by a readable endpoint'],
 ['Database CRUD','No integration credits','No separately documented per-entity charge'],
 ['Application capability licensing','Already available on this Pro workspace','Authentication, functions, connectors and workflows are reusable; no new app, cloud service or licence was purchased. Development consumes message credits, not this operating model.'],
 ['Scheduled workflow control','~498 credits/month','30-day month × 166 starts/day × one charged call step × 0.1 credit'],
 ['Backend function runs','~50 credits/month','4,980 scheduled runs × 0.01 credit; continuations/checks are extra'],
 ['Private file replication','~1 credit/upload','1,000 changed/new document versions/month ≈ 1,000 credits'],
 ['Baseline incremental usage','~1,548 integration credits/month','498 + 49.8 + 1,000; excludes initial seeding, retries, continuations, emails and generated reports'],
 ['Planning allowance','~2,000–4,000 credits/month','Scenario: 50,000 compact records, 10,000 initial files, 1,000 changed versions/month and ~100 staff. Assumptions, not measured ALS volumes.'],
 ['Initial document copy','~10,000 credits once','10,000 uploads plus function/workflow overhead; deduplicate unchanged versions'],
 ['Workspace allowance observed','170,000 integration credits/period','As inspected 13 November: 9,112.3 used, reset 6 December. Shared across Hub jobs/apps; live entitlement overrides generic plan tables.'],
 ['Incremental cash estimate','£0/month, conditional','If consumption fits the existing allowance and no upgrade is approved. Existing subscription, Microsoft licensing and labour excluded.'],
 ['Storage illustration','~250 MB records + ~20 GB files','50,000 × 5 KB and 10,000 × 2 MB before metadata/history. Not a measured storage or bandwidth entitlement.'],
 ['Cost risk','Full recopy is not the model','10,000 files × 24 × 30 ≈ 7.2 million uploads/month. Replicate only changed source versions/hashes.'],
 ['Backup & Restore','Not included on current Pro state','Requires approved upgrade. Exact price/top-up choices must be checked in Plan and billing; no invented overage price.'],
 ['External infrastructure','£0 in this design','No AWS/Azure services deployed or proposed; the Base44 failure boundary remains']
];
export const sources=['Base44 live app/workspace state, 13 November 2026','Base44 entity limits live snapshot, 13 November 2026','Base44 documentation: Managing your app data','Base44 documentation: Uploading and managing media','Base44 documentation: Backup & Restore','Base44 documentation: Credits, workflows, backend functions and API access','Existing ALS Hub Dataverse, SharePoint, workflow and Contingency source inspection'];