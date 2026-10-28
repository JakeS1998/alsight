import React from 'react';
import NetworxActivities from '@/components/networx/NetworxActivities';
export default function AccountActivity({ account }) {
  return <NetworxActivities entity="account" recordId={account.id}/>;
}