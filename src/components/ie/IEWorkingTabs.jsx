import React from 'react';
import {TabsContent} from '@/components/ui/tabs';
import IEWorkTab from '@/components/ie/IEWorkTab';
import IEDocumentsTab from '@/components/ie/IEDocumentsTab';
import IEFinanceTab from '@/components/ie/IEFinanceTab';
export default function IEWorkingTabs({engagement,canEdit,project,showDocuments=true}){
 return <>
  {['research','consultation','creative'].map(kind=><TabsContent key={kind} value={kind} className="ws-content"><IEWorkTab engagement={engagement} kind={kind} canEdit={canEdit}/></TabsContent>)}
  {showDocuments&&<TabsContent value="documents" className="ws-content"><IEDocumentsTab engagement={engagement} canEdit={canEdit} project={project}/></TabsContent>}
  <TabsContent value="finance" className="ws-content"><IEFinanceTab engagement={engagement} canEdit={canEdit}/></TabsContent>
 </>;
}