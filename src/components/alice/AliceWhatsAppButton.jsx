import React from 'react';
import { MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AliceWhatsAppButton() {
  return <a href={base44.agents.getWhatsAppConnectURL('alice')} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center justify-center gap-2 border-b border-border bg-muted/60 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
    <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat with ALICE on WhatsApp
  </a>;
}