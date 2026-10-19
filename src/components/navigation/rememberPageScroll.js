import { scrollPositions } from '@/components/navigation/navigationMemory';

function containerPath(element) {
  const parts = [];
  while (element && !element.classList.contains('portal-main')) {
    parts.unshift(`${element.tagName.toLowerCase()}:nth-child(${Array.prototype.indexOf.call(element.parentElement.children, element) + 1})`);
    element = element.parentElement;
  }
  return `.portal-main > ${parts.join(' > ')}`;
}

export default function rememberPageScroll(key, listKey, destination) {
  let latest = destination || { x: 0, y: 0, containers: {} }, restoring = !!destination, frame, timer, observer, resize;
  const save = event => {
    if (restoring) return;
    const element = event?.target;
    const containers = Object.fromEntries(Object.entries(latest.containers || {}).filter(([selector]) => {
      const node = document.querySelector(selector);
      return node && (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight);
    }));
    if (element instanceof HTMLElement && element.closest('.portal-main') && !element.classList.contains('portal-main')) containers[containerPath(element)] = { x: element.scrollLeft, y: element.scrollTop };
    latest = { x: window.scrollX, y: window.scrollY, containers };
    scrollPositions.set(key, latest);
    if (listKey) scrollPositions.set(listKey, latest);
  };
  const stop = () => {
    restoring = false;
    observer?.disconnect(); resize?.disconnect();
    cancelAnimationFrame(frame); clearTimeout(timer);
  };
  const restore = () => {
    if (!restoring) return;
    if (destination.hashId) {
      const element = document.getElementById(destination.hashId);
      if (!element) return;
      element.scrollIntoView({ behavior: 'instant' }); stop(); save(); return;
    }
    const root = document.querySelector('.portal-main');
    if (listKey && !root) return;
    window.scrollTo({ left: destination.x, top: destination.y, behavior: 'instant' });
    let ready = Math.abs(window.scrollY - destination.y) < 2 && Math.abs(window.scrollX - destination.x) < 2;
    Object.entries(destination.containers || {}).forEach(([selector, point]) => {
      const element = document.querySelector(selector);
      if (!element) { ready = false; return; }
      element.scrollTo({ left: point.x, top: point.y, behavior: 'instant' });
      if (Math.abs(element.scrollLeft - point.x) > 1 || Math.abs(element.scrollTop - point.y) > 1) ready = false;
    });
    if (ready && !root?.querySelector('[aria-busy="true"],[role="status"]')) { stop(); save(); }
  };
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore); };
  const interrupt = () => { if (restoring) stop(); save(); };
  if (restoring) {
    observer = new MutationObserver(schedule); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy'] });
    resize = new ResizeObserver(schedule); resize.observe(document.body);
    timer = setTimeout(interrupt, 15000);
    restore();
  } else { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); save(); }
  document.addEventListener('scroll', save, true);
  ['wheel','touchstart','pointerdown','keydown'].forEach(type => document.addEventListener(type, interrupt, { passive: true, capture: true }));
  return () => {
    stop(); document.removeEventListener('scroll', save, true);
    ['wheel','touchstart','pointerdown','keydown'].forEach(type => document.removeEventListener(type, interrupt, true));
  };
}