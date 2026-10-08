import React from 'react';
import PowerAutomateSetupGuide from '@/components/approvals/PowerAutomateSetupGuide';
export default function ApprovalSetup() {
 return <div className="space-y-5"><div><h1 className="font-heading text-2xl font-semibold">Approval integration setup</h1><p className="mt-2 text-sm text-muted-foreground">Connect Dataverse triggers to ALSight and return decisions through Power Automate.</p></div><PowerAutomateSetupGuide/></div>;
}