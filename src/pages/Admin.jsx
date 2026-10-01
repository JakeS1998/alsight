import React, { useState } from 'react';
import PipelineManagers from '@/components/crm/PipelineManagers';
import StaffReportingDirectory from '@/components/crm/StaffReportingDirectory';
import UKLFDigestSettings from '@/components/framework/UKLFDigestSettings';
import FrameworkFeeSettings from '@/components/admin/FrameworkFeeSettings';
import DataQualityDashboard from '@/components/admin/DataQualityDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Admin() {
  const [revision, setRevision] = useState(0);
  return <div className="space-y-5">
    <div><h1 className="font-heading text-2xl font-semibold">Administration</h1><p className="text-sm text-muted-foreground">Monitor data quality and manage portal administration.</p></div>
    <Tabs defaultValue="data-quality">
      <TabsList className="h-auto flex-wrap justify-start gap-1"><TabsTrigger value="data-quality">Data quality</TabsTrigger><TabsTrigger value="staff">Staff reporting</TabsTrigger><TabsTrigger value="reporting-overrides">Reporting overrides</TabsTrigger><TabsTrigger value="framework-fees">Framework fees</TabsTrigger><TabsTrigger value="digest">UKLF email digest</TabsTrigger></TabsList>
      <TabsContent value="data-quality" className="mt-5"><DataQualityDashboard /></TabsContent>
      <TabsContent value="staff" className="mt-5"><StaffReportingDirectory revision={revision} onUpdated={() => setRevision(value => value + 1)} /></TabsContent>
      <TabsContent value="reporting-overrides" className="mt-5"><PipelineManagers revision={revision} onUpdated={() => setRevision(value => value + 1)} /></TabsContent>
      <TabsContent value="framework-fees" className="mt-5"><FrameworkFeeSettings /></TabsContent>
      <TabsContent value="digest" className="mt-5"><UKLFDigestSettings /></TabsContent>
    </Tabs>
  </div>;
}