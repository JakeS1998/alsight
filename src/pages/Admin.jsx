import React, { useState } from 'react';
import PipelineManagers from '@/components/crm/PipelineManagers';
import StaffReportingDirectory from '@/components/crm/StaffReportingDirectory';
import UKLFDigestSettings from '@/components/framework/UKLFDigestSettings';
import DataQualityDashboard from '@/components/admin/DataQualityDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Admin() {
  const [revision, setRevision] = useState(0);
  return <div className="space-y-5">
    <div><h1 className="font-heading text-2xl font-semibold">Administration</h1><p className="text-sm text-muted-foreground">Monitor data quality and manage portal administration.</p></div>
    <Tabs defaultValue="data-quality">
      <TabsList><TabsTrigger value="data-quality">Data quality</TabsTrigger><TabsTrigger value="settings">Administration settings</TabsTrigger></TabsList>
      <TabsContent value="data-quality" className="mt-5"><DataQualityDashboard /></TabsContent>
      <TabsContent value="settings" className="mt-5 space-y-5">
        <StaffReportingDirectory revision={revision} onUpdated={() => setRevision(value => value + 1)} />
        <PipelineManagers revision={revision} onUpdated={() => setRevision(value => value + 1)} />
        <UKLFDigestSettings />
      </TabsContent>
    </Tabs>
  </div>;
}