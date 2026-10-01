import React, { useRef } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';
export default function ProjectStickyHeader({ children }) {
  const ref = useRef(null);
  useStickyHeight(ref, '--project-header-height');
  return <div ref={ref} className="space-y-6 md:sticky md:top-16 md:z-30 md:bg-secondary md:py-3">{children}</div>;
}