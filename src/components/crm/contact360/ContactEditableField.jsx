import React, { useContext, useState } from 'react';
import ContactInlineEditContext from '@/components/crm/contact360/ContactInlineEditContext';
import ContactProfileEditor from '@/components/crm/contact360/ContactProfileEditor';
import InlineEditTrigger from '@/components/forms/InlineEditTrigger';

const FIELDS = {
  Status:'relationship_status', Strength:'relationship_strength', 'Known since':'known_since', Priority:'contact_priority', Owner:'relationship_owner_contact_id',
  'Current priorities':'professional_priorities', Challenges:'professional_challenges', 'Strategic objectives':'strategic_objectives',
  Name:'full_name', 'Title / department':['job_title','department'], Email:'email', 'Alternative email':'alternative_email', Telephone:'phone', Mobile:'mobile_phone', Office:'office_location',
  'Preferred contact method / time':['preferred_communication','preferred_times'], Interests:'interests', Likes:'likes', 'Preferences / avoid':'dislikes', 'Personal context':'personal_context', Birthday:'birthday',
};
const ADMIN_FIELDS = ['full_name','first_name','last_name','job_title','department','email','email2','phone','mobile_phone'];
export default function ContactEditableField({ field, label, children }) {
  const context = useContext(ContactInlineEditContext), [editing,setEditing] = useState(false);
  const selected = field || FIELDS[label], fields = Array.isArray(selected) ? selected : [selected];
  if (!context?.canEdit || !selected || (fields.some(key => ADMIN_FIELDS.includes(key)) && !context.editorProps?.isAdmin)) return children;
  return editing ? <ContactProfileEditor {...context.editorProps} section={context.section} fields={fields}
    onSaved={profile => { context.editorProps.onSaved(profile); setEditing(false); }} onCancel={() => setEditing(false)}/>
    : <InlineEditTrigger label={label} onEdit={() => setEditing(true)}>{children}</InlineEditTrigger>;
}