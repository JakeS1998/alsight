import React from 'react';
import PowerAutomateSetupGuide from '@/components/approvals/PowerAutomateSetupGuide';
import ApprovalIntegrationStatus from '@/components/approvals/ApprovalIntegrationStatus.jsx';
import ApprovalDigestSettings from '@/components/approvals/ApprovalDigestSettings';
export default function ApprovalSetup() {
 return <div className="space-y-5"><div><h1 className="font-heading text-2xl font-semibold">Approval setup</h1><p className="mt-2 text-sm text-muted-foreground">Set up access to Power Automate approvals in ALS Hub and check the Microsoft approval digest.</p></div><ApprovalIntegrationStatus/><PowerAutomateSetupGuide/><ApprovalDigestSettings/></div>;
}