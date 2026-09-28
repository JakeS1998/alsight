import React, { useState } from 'react';
import PipelineManagers from '@/components/crm/PipelineManagers';
import StaffReportingDirectory from '@/components/crm/StaffReportingDirectory';

export default function Admin() {
  const [revision, setRevision] = useState(0);
  return <div className="space-y-5">
    <div><h1 className="font-heading text-2xl font-semibold">Administration</h1><p className="text-sm text-muted-foreground">Review imported staff managers and link reporting lines to portal accounts.</p></div>
    <StaffReportingDirectory revision={revision} onUpdated={() => setRevision(value => value + 1)} />
    <PipelineManagers revision={revision} onUpdated={() => setRevision(value => value + 1)} />
  </div>;
}