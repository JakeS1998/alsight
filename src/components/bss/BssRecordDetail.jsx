import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import { ChecklistGrid } from '@/components/documents/TriStateToggle';
import { DMA_PSO_ITEMS, JCT_CHECKLIST_ITEMS } from '@/lib/portal';
import BssRecordFields from '@/components/bss/BssRecordFields';
import { bssRegisters } from '@/components/bss/bssConfig';
export default function BssRecordDetail({ row, tab, onClose }) {
  const [record, setRecord] = useState(row.record), cache = useQueryClient();
  const saved = updated => { setRecord(updated); cache.invalidateQueries({ queryKey: ['bss-register'] }); cache.invalidateQueries({ queryKey: ['bss-totals'] }); };
  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}><SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
    <SheetHeader className="pr-8"><SheetTitle>{record[bssRegisters[tab].reference] || bssRegisters[tab].label}</SheetTitle><SheetDescription>{row.project?.name || 'Project name unavailable'} · {bssRegisters[tab].label}</SheetDescription></SheetHeader>
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap gap-2">{row.project && <Button asChild variant="outline" size="sm"><Link to={`/projects/${row.project.id}?tab=${tab === 'warranties' ? 'warranties' : 'drafting'}`}>Open project</Link></Button>}{row.party && <Button asChild variant="outline" size="sm"><Link to={`/accounts/${row.party.id}`}>{row.party.name}</Link></Button>}</div>
      <p className="text-xs text-muted-foreground">Use the edit controls on enabled fields to save through your existing Microsoft permissions. Approval decisions use the existing Approvals workspace.</p>
      <RecordUpdatedAt record={record} />
      <DataverseRecordEdit table={tab} record={record} onUpdated={saved}>
        <BssRecordFields record={record} tab={tab} />
        {(tab === 'dma' || tab === 'jct') && <section className="mt-4 rounded-panel border border-border bg-card p-4"><h3 className="mb-4 text-sm font-semibold">{tab === 'dma' ? 'PSO checklist' : 'Contract particulars checklist'}</h3><ChecklistGrid items={tab === 'dma' ? DMA_PSO_ITEMS : JCT_CHECKLIST_ITEMS} data={record} /></section>}
      </DataverseRecordEdit>
    </div>
  </SheetContent></Sheet>;
}