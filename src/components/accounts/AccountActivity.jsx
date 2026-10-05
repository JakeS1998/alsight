import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ConversationTimeline from '@/components/crm/ConversationTimeline';
import AccountActivityRecords from '@/components/accounts/AccountActivityRecords';
export default function AccountActivity({ account, contacts, user }) {
  const cache = useQueryClient();
  const opportunities = useQuery({ queryKey: ['account-activity-opportunities',account.id,user?.id,user?.role], queryFn: async () => (await base44.entities.Opportunity.filter({ account_id: { $in: [account.id,account.dataverse_id].filter(Boolean) } },{ sort: '-updated_date',limit: 50,fields: ['title'] })).items });
  return <div className="space-y-5"><AccountActivityRecords account={account} user={user} />{opportunities.error && <p className="text-sm text-destructive">Opportunity choices are unavailable.</p>}<ConversationTimeline accountId={account.id} contacts={contacts} opportunities={opportunities.data || []} user={user} canEdit={['admin','director','bdm','bsm'].includes(user?.role)} onChanged={() => { cache.invalidateQueries({ queryKey: ['accounts-view'] }); cache.invalidateQueries({ queryKey: ['account-recent-activity',account.id] }); }} /></div>;
}