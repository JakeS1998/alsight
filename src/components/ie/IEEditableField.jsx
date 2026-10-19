import React, { useContext, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import IEInlineEditContext from '@/components/ie/IEInlineEditContext';
import InlineEditTrigger from '@/components/forms/InlineEditTrigger';
import IEInlineEditor from '@/components/ie/IEInlineEditor';

export default function IEEditableField({ field, label, disabled = false, children }) {
  const context = useContext(IEInlineEditContext), { user } = useAuth();
  const [editing, setEditing] = useState(false);
  if (!context?.canEdit || disabled || (user?.role === 'sam' && ['owner_id', 'team_ids'].includes(field))) return children;
  return editing ? <IEInlineEditor field={field} section={context.section} item={context.item} onClose={() => setEditing(false)}/>
    : <InlineEditTrigger label={label} onEdit={() => setEditing(true)}>{children}</InlineEditTrigger>;
}