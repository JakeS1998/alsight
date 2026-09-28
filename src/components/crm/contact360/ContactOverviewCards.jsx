import React from 'react';
const Card = ({ title, children }) => <section className="min-w-0 rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">{title}</h2><div className="mt-3 space-y-3 text-sm">{children}</div></section>;
const Detail = ({ label, value }) => <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="whitespace-pre-wrap break-words">{value || '—'}</p></div>;
export default function ContactOverviewCards({ contact, profile, owner, health, column = 'main' }) {
  if (column === 'main') return <>
    <Card title="Relationship summary"><div className="grid gap-3 sm:grid-cols-2"><Detail label="Status" value={profile?.relationship_status?.replaceAll('_',' ')} /><Detail label="Strength" value={profile?.relationship_strength} /><Detail label="Known since" value={profile?.known_since} /><Detail label="Priority" value={profile?.contact_priority} /><Detail label="Owner" value={owner} /></div></Card>
    <Card title="Professional priorities"><Detail label="Current priorities" value={profile?.professional_priorities} /><Detail label="Challenges" value={profile?.professional_challenges} /><Detail label="Strategic objectives" value={profile?.strategic_objectives} /></Card>
    <Card title="Relationship notes"><p className="whitespace-pre-wrap break-words">{profile?.relationship_notes || 'No relationship notes yet.'}</p></Card>
  </>;
  return <>
    <Card title="Contact details"><Detail label="Name" value={contact.full_name} /><Detail label="Title / department" value={[contact.job_title, contact.department].filter(Boolean).join(' · ')} /><Detail label="Organisation" value={contact.company_name} /><Detail label="Email" value={contact.email} /><Detail label="Alternative email" value={profile?.alternative_email || contact.email2} /><Detail label="Telephone" value={contact.phone} /><Detail label="Mobile" value={contact.mobile_phone} /><Detail label="Office" value={profile?.office_location} /><Detail label="Preferred contact method / time" value={[profile?.preferred_communication, profile?.preferred_times].filter(Boolean).join(' · ')} /></Card>
    <Card title="Relationship health"><p>{health}</p></Card>
    <Card title="Relationship intelligence"><Detail label="Interests" value={profile?.interests} /><Detail label="Likes" value={profile?.likes} /><Detail label="Preferences / avoid" value={profile?.dislikes} /><Detail label="Personal context" value={profile?.personal_context || profile?.family_members} /><Detail label="Birthday" value={profile?.birthday} /></Card>
  </>;
}