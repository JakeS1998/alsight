import React from 'react';
const tables=[['Legal Documents','bss_project1','bss_project1id'],['DMA','bss_dma','bss_dmaid'],['Warranties','bss_warranty','bss_warrantyid']];
const fields=[['Drafted date','bss_drafteddate'],['Approval status','bss_approvalstatus'],['Approver name','bss_approversname'],['Approval date','bss_approvaldate'],['Approval comments','bss_approvalcomments'],['Document link','bss_linktofile']];
export default function ApprovalDataverseFields() {
 return <div className="space-y-3 rounded-lg border border-border p-4">
  <h3 className="font-semibold">Current ALSight Dataverse mappings</h3>
  <p className="text-xs text-muted-foreground">These logical names were checked against your saved mappings on 8 October 2026. The Power Automate picker may show a friendly table name instead.</p>
  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="pb-2 pr-4">Document type</th><th className="pb-2 pr-4">Table</th><th className="pb-2">Row GUID</th></tr></thead><tbody>{tables.map(([label,table,id])=><tr key={table}><td className="py-1 pr-4">{label}</td><td className="py-1 pr-4 font-mono text-xs">{table}</td><td className="py-1 font-mono text-xs">{id}</td></tr>)}</tbody></table></div>
  <dl className="grid gap-2 sm:grid-cols-2">{fields.map(([label,column])=><div key={column}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-mono text-xs">{column}</dd></div>)}</dl>
  <p className="text-xs text-muted-foreground">All three approval-status mappings are text, not choice fields. Agree the exact result text before connecting write-back. Warranty approval date is currently mapped as text; confirm its required format. The direct ALSight API route requires explicit write-back permission on all four approval result fields and the approver’s own Dataverse permissions. The existing mapping switches have not been changed by this build.</p>
 </div>;
}