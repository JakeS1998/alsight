import React from 'react';
import { DMA_PSO_ITEMS } from '@/lib/portal';
import DMAFieldValue from '@/components/documents/DMAFieldValue';
const fields = [
  ['document_id', 'Document ID'], ['executed', 'Executed'], ['dma_version', 'DMA version'],
  ['drafted_date', 'Drafted date', true], ['drafting_due_date', 'Drafting due', true],
  ['approval_status', 'Approval status'], ['approvers_name', 'Approver'], ['approval_date', 'Approval date', true], ['approval_comments', 'Approval comments'],
  ['sent_for_signing', 'Sent for signing', true], ['signing_target_date', 'Signing target', true], ['date_of_execution', 'Execution date', true], ['shared_with_council', 'Shared with council'],
  ...DMA_PSO_ITEMS.flatMap(item => [[item.key, item.label], [item.commentsKey, `${item.label} comments`]]),
  ['pso_signoff', 'PSO sign-off'], ['riba3_completion', 'RIBA 3 completion'], ['riba4_completion', 'RIBA 4 completion'],
  ['conditions_precedent', 'Conditions precedent'], ['conditions_precedent_agreed', 'Conditions precedent agreed'],
  ['comments', 'Comments'], ['link_to_file', 'File link', false, true], ['status', 'Status']
];
export default function DMAFields({ doc }) {
  return <dl className="mt-4 space-y-2 border-t border-border pt-4">
    {fields.map(([key, label, date, link]) => <div key={key} className="grid grid-cols-2 gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground"><DMAFieldValue value={doc[key]} date={date} link={link} /></dd>
    </div>)}
  </dl>;
}