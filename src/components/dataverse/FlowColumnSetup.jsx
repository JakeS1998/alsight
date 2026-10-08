import React from 'react';
import { Button } from '@/components/ui/button';
import FlowMappingRows from '@/components/dataverse/FlowMappingRows';
export default function FlowColumnSetup({ table, spec, settings, metadata, mappings, setMappings, columnPlans, setColumnPlans, busy, logicalName, inspect, save, dirty }) {
  const automatic = () => {
    const suggested = (metadata.suggestions || []).filter(m => !columnPlans[m.local]);
    setMappings(suggested.map(m => ({ ...m, origin: 'automatic' })));
  };
  const localCount = Object.values(columnPlans).filter(mode => mode === 'base44_only').length;
  const neededCount = Object.values(columnPlans).filter(mode => mode === 'needs_dataverse').length;
  return (
    <details className="space-y-3 rounded-lg border border-border p-3">
      <summary className="cursor-pointer text-sm font-semibold">Mapped columns setup · {mappings.length} mapped · {localCount} Base44-only · {neededCount} need Dataverse columns</summary>
      <p className="text-xs text-muted-foreground">See saved automatic and manual mappings below. Load live column options to map more fields. Unmapped data is preserved until you decide where it belongs.</p>
      {settings && <p className="text-xs text-muted-foreground">Record identity: {settings.primaryId} → {spec.identityField || 'dataverse_id'} (managed link).</p>}
      {dirty && <p role="status" className="text-xs text-muted-foreground">Unsaved changes. Save the column setup before syncing.</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={Boolean(busy) || !logicalName} onClick={inspect}>Load / reload column options</Button>
        {metadata && <Button variant="outline" disabled={Boolean(busy)} onClick={automatic}>Use automatic suggestions</Button>}
      </div>
      {metadata?.warning && <p className="text-sm text-destructive">{metadata.warning}</p>}
      <FlowMappingRows prefix={table} fields={spec.fields} preservedFields={spec.preservedFields} required={spec.required} enums={spec.enums} readOnly={spec.readOnly} sourceFields={metadata?.fields || []} suggestions={metadata?.suggestions || []} mappings={mappings} onChange={setMappings} columnPlans={columnPlans} onPlansChange={setColumnPlans} loaded={Boolean(metadata)} disabled={Boolean(busy)} />
      <Button disabled={Boolean(busy) || !(metadata?.logicalName || settings?.logicalName)} onClick={save}>Save column setup</Button>
    </details>
  );
}