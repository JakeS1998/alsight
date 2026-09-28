import React from 'react';
import PipelineManagers from '@/components/crm/PipelineManagers';

export default function Admin() {
  return <div className="space-y-5">
    <div><h1 className="font-heading text-2xl font-semibold">Administration</h1><p className="text-sm text-muted-foreground">Manage reporting lines for staff with portal accounts. The imported SystemUsers manager values are not yet available on those accounts.</p></div>
    <PipelineManagers />
  </div>;
}