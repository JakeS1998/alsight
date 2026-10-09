import React from 'react';
import PowerAutomateSetupGuide from '@/components/approvals/PowerAutomateSetupGuide';
import ApprovalIntegrationStatus from '@/components/approvals/ApprovalIntegrationStatus.jsx';
import ApprovalRoutingAdmin from '@/components/approvals/ApprovalRoutingAdmin.jsx';
export default function ApprovalSetup() {
 return <div className="space-y-5"><div><h1 className="font-heading text-2xl font-semibold">Approval setup</h1><p className="mt-2 text-sm text-muted-foreground">Configure table routing, check recipients and manage Dataverse approval integration.</p></div><ApprovalRoutingAdmin/><ApprovalIntegrationStatus/><PowerAutomateSetupGuide/></div>;
}