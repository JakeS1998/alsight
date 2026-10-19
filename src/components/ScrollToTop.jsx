import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useAuth } from '@/lib/AuthContext';
import { listPaths, scrollPositions } from '@/components/navigation/navigationMemory';
import rememberPageScroll from '@/components/navigation/rememberPageScroll';

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash, key, search } = useLocation();
  const navigationType = useNavigationType(), { user } = useAuth();
  const scope = `${user?.id || 'anonymous'}:${user?.role || ''}`;
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => {
    const entryKey = `${scope}:${key}:${pathname}:${search}`;
    const listKey = listPaths.has(pathname) ? `${scope}:list:${pathname}` : null;
    const saved = (navigationType === 'POP' ? scrollPositions.get(entryKey) : null) || (listKey && scrollPositions.get(listKey));
    return rememberPageScroll(entryKey, listKey, hash ? { hashId: getHashId(hash) } : saved);
  }, [pathname, hash, key, search, scope, navigationType]);

  return null;
}