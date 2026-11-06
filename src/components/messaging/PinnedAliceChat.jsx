import React from 'react';
import { Pin, Sparkles } from 'lucide-react';
import AliceWhatsAppButton from '@/components/alice/AliceWhatsAppButton';
export default function PinnedAliceChat({ onSelect }) {
  return <div className="shrink-0 border-b border-border bg-primary/10"><button type="button" onClick={onSelect} className="flex w-full items-center gap-3 p-3 text-left hover:bg-primary/15"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Sparkles size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">ALICE</span><span className="block text-xs text-muted-foreground">Your assistant · Saved chats & new chat</span></span><Pin size={14} aria-label="Pinned conversation" className="text-foreground"/></button><AliceWhatsAppButton/></div>;
}