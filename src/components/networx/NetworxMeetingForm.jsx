import React from 'react';
import useOutlookConnection from '@/components/outlook/useOutlookConnection';
import NetworxMeetingConnection from '@/components/networx/NetworxMeetingConnection';
import NetworxActivityForm from '@/components/networx/NetworxActivityForm';
export default function NetworxMeetingForm(props) {
 const connection=useOutlookConnection();
 return <NetworxActivityForm {...props} disabled={connection.loading || !connection.connected || connection.calendar?.canEdit===false} connection={<NetworxMeetingConnection connection={connection}/>}/>;
}