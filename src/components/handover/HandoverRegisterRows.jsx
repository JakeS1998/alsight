import React from 'react';
import { Button } from '@/components/ui/button';
import HandoverRegisterFields from '@/components/handover/HandoverRegisterFields';
export default function HandoverRegisterRows({ fields, rows, onChange, editable, disabled }) {
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-medium">Entries ({rows.length}/50)</h4>{editable && <Button type="button" size="sm" variant="outline" disabled={disabled || rows.length >= 50} onClick={() => onChange([...rows, {}])}>Add entry</Button>}</div>
    {!rows.length && <p className="text-sm text-muted-foreground">No entries yet.</p>}
    {rows.map((row, index) => <div key={index} className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between"><p className="text-sm font-medium">Entry {index + 1}</p>{editable && <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove</Button>}</div>
      <HandoverRegisterFields fields={fields} values={row} disabled={disabled || !editable} onChange={(key, value) => onChange(rows.map((old, i) => i === index ? { ...old, [key]: value } : old))} />
    </div>)}
  </div>;
}