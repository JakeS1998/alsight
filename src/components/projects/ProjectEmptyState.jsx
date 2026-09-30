import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectEmptyState({ icon: Icon, title, description, to, action, onAction }) {
  return <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
    <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
    <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    {to && <Link to={to} className="mt-3 inline-block text-sm font-medium text-foreground underline underline-offset-4">{action}</Link>}
    {onAction && <button type="button" onClick={onAction} className="mt-3 text-sm font-medium text-foreground underline underline-offset-4">{action}</button>}
  </div>;
}