import React from 'react';
import { Link } from 'react-router-dom';
import DMAFields from '@/components/documents/DMAFields';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';
import useEditableRecord from '@/components/dataverse/useEditableRecord';
import DMAFieldValue from '@/components/documents/DMAFieldValue';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
export default function DMADirectoryCard({ doc: sourceDoc, project }) {
  const [doc, setDoc] = useEditableRecord(sourceDoc);
  return <DataverseRecordEdit table="dma" record={doc} onUpdated={setDoc}><article className="flex flex-col rounded-2xl border border-border bg-card p-5">
    <h3 className="text-sm font-semibold text-foreground"><DMAFieldValue value={doc.document_id} /></h3>
    <p className="mt-1 text-xs text-muted-foreground">Development Agreement (DMA)</p>
    <RecordUpdatedAt record={doc} className="mt-2" />
    <dl className="mt-3 space-y-2 text-xs">
      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Project</dt><dd className="text-right">{project ? <Link className="text-primary hover:underline" to={`/projects/${project.id}`}>{project.name}</Link> : <DMAFieldValue value={null} />}</dd></div>
      {[['Executed', 'executed'], ['Drafted', 'drafted_date', true], ['Approval', 'approval_status'], ['Execution', 'date_of_execution', true], ['File', 'link_to_file', false, true]].map(([label, key, date, link]) => <div key={key} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right"><InlineDataverseField field={key} label={label}><DMAFieldValue value={doc[key]} date={date} link={link} /></InlineDataverseField></dd></div>)}
    </dl>
    <details className="mt-4"><summary className="cursor-pointer text-xs font-medium text-foreground">View all DMA fields</summary><DMAFields doc={doc} /></details>
  </article></DataverseRecordEdit>;
}