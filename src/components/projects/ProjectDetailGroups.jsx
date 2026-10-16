import React from 'react';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';

export default function ProjectDetailGroups({ groups }) {
  return <dl className="ws-teamgrid">{groups.flatMap(group => group.fields.map(([label, value]) => <div className="ws-teamitem" key={`${group.title}-${label}`}>
    <dt className="ws-label">{label}</dt>
    <dd className="ws-value"><InlineDataverseField label={label}>{value || '—'}</InlineDataverseField></dd>
  </div>))}</dl>;
}