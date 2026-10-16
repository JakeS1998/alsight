import React from 'react';
import { UsersRound, Search } from 'lucide-react';

export default function InsightsEngagementIcon({ className = '' }) {
  return <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`}>
    <UsersRound className="h-full w-full" />
    <Search className="absolute -bottom-0.5 -right-1 h-2.5 w-2.5 fill-als-navy" strokeWidth={2.5} />
  </span>;
}