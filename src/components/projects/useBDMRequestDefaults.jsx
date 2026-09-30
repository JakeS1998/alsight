import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useBDMRequestDefaults({ setForm, setDirectorOptions }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const version = useRef(0);
  const addDirector = option => {
    if (!option) return;
    setDirectorOptions(options => options.some(item => item.value === option.value) ? options : [...options, option].sort((a, b) => a.label.localeCompare(b.label)));
  };
  const choose = async bdmId => {
    const current = ++version.current;
    setNotice(''); setLoading(!!bdmId);
    setForm(form => ({ ...form, bdm_aad_id: bdmId, director_aad_id: '', department_id: '' }));
    if (!bdmId) return;
    try {
      const { data } = await base44.functions.invoke('getProjectBDMManager', { action: 'request_defaults', bdmId });
      if (current !== version.current) return;
      addDirector(data.directorOption);
      setForm(form => form.bdm_aad_id === bdmId ? { ...form, director_aad_id: data.director_aad_id, department_id: data.department_id } : form);
      setNotice(data.notice || 'Director and region populated from the BDM’s recorded assignments.');
    } catch (error) {
      if (current === version.current) setNotice(error.response?.data?.error || 'Unable to look up this BDM’s assignments. Please select Director and region manually.');
    } finally { if (current === version.current) setLoading(false); }
  };
  return { choose, loading, notice, addDirector };
}