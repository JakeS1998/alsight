import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
export default function HoldDeleteButton({ onConfirm }) {
  const timer = useRef(null), started = useRef(0), confirmed = useRef(false), [holding, setHolding] = useState(false);
  const cancel = () => { clearTimeout(timer.current); timer.current = null; setHolding(false); };
  useEffect(() => {
    window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', cancel);
    return () => { clearTimeout(timer.current); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', cancel); };
  }, []);
  const begin = () => {
    if (timer.current || confirmed.current) return;
    started.current = performance.now(); setHolding(true);
    timer.current = setTimeout(() => {
      if (document.hidden || performance.now() - started.current < 300 || confirmed.current) return cancel();
      confirmed.current = true; onConfirm();
    }, 300);
  };
  return <Button type="button" className="relative select-none overflow-hidden touch-none" aria-label="Hold for 300 milliseconds to confirm delete"
    onPointerDown={event => { if (event.button === 0 && event.isPrimary) { event.preventDefault(); begin(); } }}
    onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onBlur={cancel}
    onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) cancel(); }}
    onKeyDown={event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) begin(); } }}
    onKeyUp={event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); cancel(); } }}
    onClick={event => event.preventDefault()} onContextMenu={event => event.preventDefault()}>
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 origin-left bg-foreground/15" style={{ transform: `scaleX(${holding ? 1 : 0})`, transition: holding ? 'transform 300ms linear' : 'none' }}/>
    <span className="relative">Hold to delete (0.3s)</span>
  </Button>;
}