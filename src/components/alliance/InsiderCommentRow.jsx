import React from 'react';
import fullName from '@/components/data/fullName';
import { Trash2 } from 'lucide-react';
export default function InsiderCommentRow({ comment, user, groupOwnerId, removing, onRemove }) {
  const canRemove = comment.author_id === user.id || user.id === groupOwnerId || ['admin', 'director'].includes(user.role);
  return <article className="rounded-lg bg-muted p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{fullName(comment.author_name,comment.author_id)}</p><time dateTime={comment.created_date} className="text-xs text-muted-foreground">{new Date(comment.created_date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></div>{canRemove && <button type="button" aria-label={`Remove comment by ${fullName(comment.author_name,comment.author_id)}`} disabled={removing} onClick={() => onRemove(comment.id)} className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{comment.body}</p></article>;
}