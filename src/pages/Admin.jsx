import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PipelineManagers from '@/components/crm/PipelineManagers';
import StaffReportingDirectory from '@/components/crm/StaffReportingDirectory';
import UKLFDigestSettings from '@/components/framework/UKLFDigestSettings';
import FrameworkFeeSettings from '@/components/admin/FrameworkFeeSettings';
import DataQualityDashboard from '@/components/admin/DataQualityDashboard';
import DataverseConnectionSettings from '@/components/admin/DataverseConnectionSettings';
import DataverseFlowAdmin from '@/components/dataverse/DataverseFlowAdmin';
import ASEAdminSettings from '@/components/ase/ASEAdminSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Admin() {
  const [revision, setRevision] = useState(0);
  return <div className="space-y-5">
    <div><h1 className="font-heading text-2xl font-semibold">Administration</h1><p className="text-sm text-muted-foreground">Monitor data quality and manage portal administration.</p></div>
    <Link to="/admin/lookout" className="inline-flex rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold">The Lookout · Weekly newsletter</Link>
    <Tabs defaultValue="data-quality">
      <TabsList className="h-auto flex-wrap justify-start gap-1"><TabsTrigger value="data-quality">Data quality</TabsTrigger><TabsTrigger value="staff">Staff reporting</TabsTrigger><TabsTrigger value="reporting-overrides">Reporting overrides</TabsTrigger><TabsTrigger value="framework-fees">Framework fees</TabsTrigger><TabsTrigger value="digest">UKLF email digest</TabsTrigger><TabsTrigger value="ase">All Seeing Eye policy</TabsTrigger><TabsTrigger value="dataverse">Dataverse</TabsTrigger></TabsList>
      <TabsContent value="data-quality" className="mt-5"><DataQualityDashboard /></TabsContent>
      <TabsContent value="staff" className="mt-5"><StaffReportingDirectory revision={revision} onUpdated={() => setRevision(value => value + 1)} /></TabsContent>
      <TabsContent value="reporting-overrides" className="mt-5"><PipelineManagers revision={revision} onUpdated={() => setRevision(value => value + 1)} /></TabsContent>
      <TabsContent value="framework-fees" className="mt-5"><FrameworkFeeSettings /></TabsContent>
      <TabsContent value="digest" className="mt-5"><UKLFDigestSettings /></TabsContent>
      <TabsContent value="ase" className="mt-5"><ASEAdminSettings /></TabsContent>
      <TabsContent value="dataverse" className="mt-5"><div className="space-y-5"><DataverseConnectionSettings /><DataverseFlowAdmin /></div></TabsContent>
    </Tabs>
  </div>;
}