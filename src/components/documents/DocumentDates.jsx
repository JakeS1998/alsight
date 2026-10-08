import React from 'react';
import DMAFieldValue from '@/components/documents/DMAFieldValue';
const dates = [['Drafting due', 'drafting_due_date'], ['Drafted', 'drafted_date'], ['Approval', 'approval_date'], ['Sent to client', 'sent_to_client'], ['Signing target', 'signing_target_date'], ['Execution', 'date_of_execution'], ['Fee proposal', 'fee_proposal_date']];
export default function DocumentDates({ doc, hideFinancials = false }) {
  return <details className="mt-3 text-xs"><summary className="cursor-pointer font-medium">All document dates</summary><dl className="mt-3 space-y-2">{dates.filter(([, field]) => !hideFinancials || field !== 'fee_proposal_date').map(([label, field]) => <div key={field} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd><DMAFieldValue value={doc[field]} date /></dd></div>)}</dl></details>;
}