import React, { useLayoutEffect, useRef, useState } from 'react';
import '@/components/navigation/sliding-tabs.css';

export default function SlidingTabHighlight() {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const list = ref.current.parentElement;
    let mounted = true;
    const resize = new ResizeObserver(update);
    function update() {
      const tabs = [...list.children].filter(child => child.getAttribute('role') === 'tab' || child.hasAttribute('aria-pressed'));
      tabs.forEach(tab => resize.observe(tab));
      const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('aria-pressed') === 'true' || tab.getAttribute('data-state') === 'active');
      if (!active) { setBox(null); return; }
      const parent = list.getBoundingClientRect(), rect = active.getBoundingClientRect();
      const next = { x: rect.left - parent.left + list.scrollLeft - list.clientLeft, y: rect.top - parent.top + list.scrollTop - list.clientTop, width: rect.width, height: rect.height };
      setBox(previous => previous && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
    }
    const changes = new MutationObserver(update);
    changes.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected', 'aria-pressed', 'data-state'] });
    resize.observe(list);
    update();
    document.fonts.ready.then(() => { if (mounted) update(); });
    return () => { mounted = false; resize.disconnect(); changes.disconnect(); };
  }, []);
  return <span ref={ref} aria-hidden="true" className="sliding-tab-highlight" data-positioned={!!box} style={box ? { width: box.width, height: box.height, transform: `translate(${box.x}px, ${box.y}px)` } : undefined}/>;
}