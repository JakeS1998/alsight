import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import aliceAccessKey from '@/components/alice/aliceAccessKey';
import aliceSuggestionPrompts from '@/components/alice/aliceSuggestionPrompts';
import aliceRecordSuggestions, { aliceRecordTerm, insertAliceRecord } from '@/components/alice/aliceRecordSuggestions';

export default function useAliceSuggestions({ value, cursor, mode, widgets, enabled }) {
  const { user } = useAuth();
  const scope = user?.role === 'framework_stakeholder' ? 'framework' : mode;
  const prefix = value.slice(0, cursor), suffix = value.slice(cursor);
  const term = enabled ? aliceRecordTerm(prefix) : '';
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), 450);
    return () => clearTimeout(timer);
  }, [term]);
  const canSearch = !!user?.id && term.length >= 3;
  const search = useQuery({
    queryKey: ['alice-typeahead', aliceAccessKey(user), scope, debounced, prefix],
    queryFn: () => aliceRecordSuggestions(debounced, prefix, user, scope),
    enabled: enabled && canSearch && term === debounced,
    staleTime: 30000, gcTime: 60000, retry: false, refetchOnWindowFocus: false,
  });
  const prompts = enabled ? aliceSuggestionPrompts(prefix, scope, user?.role, widgets).map(item => ({ ...item, value: item.value + suffix })) : [];
  const result = enabled && canSearch && term === debounced ? search.data : null;
  const records = (result?.records || []).map(item => ({ ...item, value: insertAliceRecord(prefix, term, item.text) + suffix }));
  return { items: [...prompts, ...records], loading: enabled && canSearch && (term !== debounced || search.isFetching), error: result?.partial || (enabled && canSearch && term === debounced && search.isError) ? 'Some records could not be searched. You can still type your message.' : '' };
}