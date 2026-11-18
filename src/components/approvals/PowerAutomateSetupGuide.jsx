import React from 'react';
import {Link} from 'react-router-dom';
const steps = [
 ['Start with the Microsoft flow', 'Set the approvers in Power Automate and use the Dataverse environment connected to ALS Hub. If the flow needs to update the source record after a decision, configure that in Power Automate.'],
 ['Grant Approval Centre access', 'In People, open the approver’s Portal Account and enable Approval access. The approver must sign in with the same work email to use it.'],
 ['Connect each approver’s Dataverse account', 'Each approver connects their own work account in Account Settings. Approval access in ALS Hub does not grant Microsoft permissions; the account must already be allowed to read its assigned approvals in Dataverse.'],
 ['Open an assigned approval', 'In Approval Centre, open a Microsoft approval and follow its link to respond in Microsoft. Return to ALS Hub and refresh to see the updated status.'],
];
export default function PowerAutomateSetupGuide() {
 return <section className="space-y-5 rounded-panel border border-border bg-card p-6">
  <h2 className="font-heading text-xl font-semibold">Power Automate setup guide</h2>
  <ol className="space-y-5">{steps.map(([title,description],index)=><li key={title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{index+1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div></li>)}</ol>
  <div className="flex flex-wrap gap-4 text-sm"><Link to="/people" className="font-semibold underline">Manage approval access</Link><Link to="/account-settings" className="underline">Connect Dataverse</Link><Link to="/approvals" className="underline">Open Approval Centre</Link></div>
 </section>;
}