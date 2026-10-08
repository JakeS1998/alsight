import React, { useContext } from 'react';
import DataverseEditContext from '@/components/dataverse/DataverseEditContext';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Check } from 'lucide-react';
import CompletionVariance from '@/components/projects/CompletionVariance';
import { formatDate } from '@/lib/portal';

export default function ProjectWorkspaceDates({ project, singleTask, ribaRows, expectedDates, ribaDates, setRibaDates, canEdit, saving, saved, saveError, onSave }) {
  const { mappedFields = [], checking = false } = useContext(DataverseEditContext) || {};
  const rows = [...ribaRows, { stage: singleTask ? 'Single task' : 'Construction', term: project.construction_term_weeks, key: 'practical_completion_date', expected: expectedDates.riba5_system_date }];
  const localDates = canEdit && rows.some(row => !mappedFields.includes(row.key));
  return <section className="ws-card ws-panel ws-dates">
    <div className="ws-panelhead">
      <h3 className="ws-sectiontitle">{singleTask ? 'Task completion' : 'RIBA Timeframes'}</h3>
      {localDates && <div className="flex items-center gap-3">
        {saveError && <span role="alert" className="text-xs text-destructive">{saveError}</span>}
        {saved && <span className="flex items-center gap-1 text-xs text-success"><Check size={14} /> Saved</span>}
        <Button size="sm" onClick={onSave} disabled={saving || checking} className="ws-save">{saving ? <Loader2 className="animate-spin" /> : <Save />}Save Dates</Button>
      </div>}
    </div>
    <div className="overflow-x-auto"><table className="ws-date-table">
      <colgroup><col style={{ width: singleTask ? '35%' : '19.63%' }} />{!singleTask && <><col style={{width:'16.82%'}} /><col style={{width:'24.3%'}} /></>}<col style={{width: singleTask ? '65%' : '24.3%'}} />{!singleTask && <col style={{width:'14.95%'}} />}</colgroup>
      <thead><tr><th>{singleTask ? 'Task' : 'Stage'}</th>{!singleTask && <><th>Term (Weeks)</th><th>Expected Completion</th></>}<th>Actual Completion</th>{!singleTask && <th>Variance</th>}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.key}>
        <td>{row.stage}</td>
        {!singleTask && <><td><InlineDataverseField field={row.key === 'practical_completion_date' ? 'construction_term_weeks' : row.key.replace('_end', '_term_weeks')} label={`${row.stage} Term (Weeks)`}>{row.term || '—'}</InlineDataverseField></td><td title="System date — read only">{formatDate(row.expected)}</td></>}
        <td><InlineDataverseField field={row.key} label={singleTask ? 'Task completion' : `${row.stage} Actual Completion`}>{canEdit && !mappedFields.includes(row.key) ? <input type="date" aria-label={singleTask ? 'Task completion' : `${row.stage} Actual Completion`} disabled={saving || checking} value={ribaDates[row.key]} onChange={event => setRibaDates({ ...ribaDates, [row.key]: event.target.value })} className="focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /> : <span>{formatDate(project[row.key])}</span>}</InlineDataverseField></td>
        {!singleTask && <td><CompletionVariance expected={row.expected} actual={canEdit && !mappedFields.includes(row.key) ? ribaDates[row.key] : project[row.key]} /></td>}
      </tr>)}</tbody>
    </table></div>
  </section>;
}