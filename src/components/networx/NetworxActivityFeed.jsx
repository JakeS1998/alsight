import React from 'react';
import groupNetworxActivities from '@/components/networx/groupNetworxActivities';
import NetworxEmailThread from '@/components/networx/NetworxEmailThread';
import NetworxActivityRow from '@/components/networx/NetworxActivityRow';
export default function NetworxActivityFeed({rows,entity,recordId,user}) {
 return <ol className="space-y-2">{groupNetworxActivities(rows).map(item=>item.thread ? <NetworxEmailThread key={item.key} row={item.row} entity={entity} recordId={recordId} user={user}/> : <NetworxActivityRow key={item.key} row={item.row} entity={entity} recordId={recordId} user={user}/>)}</ol>;
}