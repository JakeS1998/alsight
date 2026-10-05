import React from 'react';

export default function ProjectDetailGroups({ groups }) {
  return <div className="ws-detailgroups">{groups.map(group => <section className="ws-detailgroup" key={group.title} aria-label={group.title}>
    <h4>{group.title}</h4>
    <dl className="ws-details">{group.fields.map(([label, value]) => <div className="ws-field" key={label}>
      <dt className="ws-label">{label}</dt>
      <dd className="ws-value">{value || '—'}</dd>
    </div>)}</dl>
  </section>)}</div>;
}