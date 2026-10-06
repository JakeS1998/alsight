import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function useExpandingSearch() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false), [term, setTerm] = useState('');
  const root = useRef(null), input = useRef(null), trigger = useRef(null);
  const close = useCallback((restoreFocus = false) => {
    setOpen(false); setTerm('');
    if (restoreFocus) trigger.current?.focus();
  }, []);
  useEffect(() => { close(); }, [pathname, close]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) close(); };
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); close(true); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open, close]);
  const onKeyDown = event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const inInput = event.target === input.current;
    if (inInput && ['Home', 'End'].includes(event.key)) return;
    const results = Array.from(root.current?.querySelectorAll('#portal-search-results a, #portal-search-results button:not(:disabled)') || []);
    if (!results.length) return;
    event.preventDefault();
    const index = results.indexOf(document.activeElement);
    if (event.key === 'ArrowUp' && index === 0) { input.current?.focus(); return; }
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? results.length - 1 : index < 0 ? (event.key === 'ArrowUp' ? results.length - 1 : 0) : (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
    results[next].focus();
  };
  const onBlur = event => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget)) close();
  };
  return { open, setOpen, term, setTerm, root, input, trigger, close, onKeyDown, onBlur };
}