import React from 'react';
export default function IERecordReference({item}){
 const project=item.project_id?(item.project_number||'Project number not assigned'):'';
 return <>{[item.reference,project].filter(Boolean).join(' | ')}</>;
}