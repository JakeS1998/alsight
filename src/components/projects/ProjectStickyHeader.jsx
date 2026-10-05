import React, { useRef } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';
export default function ProjectStickyHeader({ children }) {
  const ref = useRef(null);
  useStickyHeight(ref, '--project-header-height');
  return <div ref={ref} className="min-w-0 w-full space-y-4 lg:sticky lg:top-[var(--portal-header-height,4rem)] lg:z-30 lg:bg-secondary lg:py-3">{children}</div>;
}