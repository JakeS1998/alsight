import React from 'react';
import useOutlookConnection from '@/components/outlook/useOutlookConnection';
import OutlookConnectionPanel from '@/components/outlook/OutlookConnectionPanel';
export default function OutlookConnectionCard() {
  const connection = useOutlookConnection();
  return <OutlookConnectionPanel connection={connection} />;
}