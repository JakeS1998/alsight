import React from 'react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

export default function AliceWhatsAppButton() {
  return <a href={base44.agents.getWhatsAppConnectURL('alice')} target="_blank" rel="noopener noreferrer" className="alice-whatsapp flex shrink-0 items-center justify-center gap-2 border-b border-border bg-primary/15 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/25">
    <Image src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" fittingType="fit" className="h-4 w-4 shrink-0" alt="" aria-hidden="true" /> Chat with ALICE on WhatsApp
  </a>;
}