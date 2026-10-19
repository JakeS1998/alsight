import React from 'react';
export default function IERecordReference({item}){
 const project=item.project_id?(item.project_number||item.project_name||'Linked project'):'';
 return <>{[item.reference,project].filter(Boolean).join(' | ')}</>;
}