import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import HandoverDocuments from '@/components/handover/HandoverDocuments';
import HandoverRegisterBuilder from '@/components/handover/HandoverRegisterBuilder';

const registerKeys = ['om', 'hs', 'training', 'assets', 'defects', 'final_account'];
export default function HandoverEvidence({ projectId, item, editable, busy, onAction, expanded }) {
  const [method, setMethod] = useState(item.documents.some(file => !file.superseded) || !item.register_version ? 'upload' : 'builder');
  const buildable = registerKeys.includes(item.key);
  return <div className="space-y-3">
    {buildable && <>
      <p className="text-sm font-medium">Upload an existing document or use the portal builder</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`${item.label} evidence method`}>
        <Button type="button" size="sm" variant={method === 'upload' ? 'default' : 'outline'} aria-pressed={method === 'upload'} onClick={() => setMethod('upload')}>Upload document</Button>
        <Button type="button" size="sm" variant={method === 'builder' ? 'default' : 'outline'} aria-pressed={method === 'builder'} onClick={() => setMethod('builder')}>Use portal builder</Button>
      </div>
      {method === 'upload' && <p className="text-xs text-muted-foreground">Upload your existing handover document instead of filling in the builder, then save your completion review. Any saved portal register is retained.</p>}
    </>}
    <div hidden={buildable && method !== 'builder'}>
      <HandoverRegisterBuilder projectId={projectId} item={item} editable={editable} busy={busy} onAction={onAction} expanded={expanded && (!buildable || method === 'builder')} />
    </div>
    <p className="text-sm font-medium">{buildable && method === 'builder' ? 'Supporting documents' : 'Handover documents'}</p>
    <HandoverDocuments item={item} editable={editable} busy={busy} onAction={onAction} />
  </div>;
}