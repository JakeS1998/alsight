import React from 'react';
import BmsTaskRow from '@/components/delivery/BmsTaskRow';
export default function BmsTaskList({stage,projectId,canEdit,onSave,onSelect,loading,error,retry}) {
 if(loading)return <p role="status" className="text-xs text-muted-foreground">Loading BMS requirements…</p>;
 if(error)return <p role="alert" className="text-xs text-destructive">BMS requirements unavailable. <button type="button" className="underline" onClick={retry}>Retry</button></p>;
 return <div><p className="mb-2 text-xs text-muted-foreground">Development-column BMS checks. Existing records are reused, not copied. Recording approval evidence does not issue or grant an approval.</p>{stage.checks?.map(task=><BmsTaskRow key={task.key} task={task} projectId={projectId} canEdit={canEdit} onSave={onSave} onSelect={onSelect}/>)}</div>;
}