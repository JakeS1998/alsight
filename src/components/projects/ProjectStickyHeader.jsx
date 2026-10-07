import React, { useEffect, useRef, useState } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';
export default function ProjectStickyHeader({ children, className = '' }) {
  const ref = useRef(null);
  const [compact, setCompact] = useState(false);
  useStickyHeight(ref, '--project-header-height');
  useEffect(() => {
    const element = ref.current;
    const origin = element.getBoundingClientRect().top + window.scrollY;
    const update = () => {
      const stickyTop = parseFloat(window.getComputedStyle(element).top) || 0;
      const threshold = Math.max(0, origin - stickyTop);
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setCompact(current => desktop && (current ? window.scrollY > threshold : window.scrollY > threshold + 32));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div ref={ref} data-compact={compact} className={`min-w-0 w-full space-y-4 lg:sticky lg:top-[var(--portal-header-height,4rem)] lg:z-30 lg:bg-secondary lg:py-3 ${className}`}>{children}</div>;
}