import { useEffect, useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { bssRegisters } from '@/components/bss/bssConfig';
import { bssFilter, bssPage } from '@/components/bss/bssData';
export default function useBssRegister(tab) {
  const { user } = useAuth();
  const [search, setSearch] = useState(''), [debounced, setDebounced] = useState('');
  const [view, setView] = useState('all'), [status, setStatus] = useState('active'), [sort, setSort] = useState('-updated_date');
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const key = ['bss-register', user?.id, user?.role, tab, debounced, view, status];
  const filter = useQuery({ queryKey: [...key, 'filter'], queryFn: () => bssFilter(tab, debounced, view, status), staleTime: 30000 });
  const records = useInfiniteQuery({ queryKey: [...key, sort, 'pages'], queryFn: ({ pageParam }) => bssPage(tab, filter.data, pageParam, sort), initialPageParam: null, getNextPageParam: last => last.has_more ? last.next_cursor : undefined, enabled: !!filter.data, staleTime: 30000 });
  const count = useQuery({ queryKey: [...key, 'count'], queryFn: () => base44.entities[bssRegisters[tab].entity].count(filter.data), enabled: !!filter.data, staleTime: 30000 });
  return { search, setSearch, view, setView, status, setStatus, sort, setSort, records, count, rows: records.data?.pages.flatMap(result => result.items) || [], loading: filter.isPending || records.isPending, error: filter.error || records.error || count.error, retry: () => { filter.refetch(); records.refetch(); count.refetch(); } };
}