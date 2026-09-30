import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RISK_COLUMNS, prepareRisk } from '@/components/delivery/riskRegisterColumns';
export default function useRiskImport(project, onImported) {
  const [file, setFile] = useState(null), [rows, setRows] = useState([]), [note, setNote] = useState(''), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [review, setReview] = useState(false);
  const analyse = async e => {
    e.preventDefault(); setError(''); setNotice('');
    if (!file || !/\.(pdf|docx|xlsx|csv)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setError('Choose a PDF, Word (.docx), Excel (.xlsx) or CSV file, up to 10 MB.'); return; }
    setBusy('analysing');
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { data } = await base44.functions.invoke('interpretRiskRegister', { projectId: project.id, fileUri: file_uri });
      if (data.error) throw new Error(data.error);
      if (!data.risks?.length) throw new Error('ALICE found no risk entries. Try another file or add risks manually.');
      setRows(data.risks.map(row => ({ ...row, selected: true }))); setNote(data.note); setReview(true);
    } catch (e) { setError(e.response?.data?.error || e.message || 'Unable to interpret the register.'); }
    finally { setBusy(''); }
  };
  const change = (index, key, value) => setRows(old => old.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const save = async () => {
    setError(''); setBusy('saving');
    try {
      const selected = rows.filter(row => row.selected);
      if (!selected.length) throw new Error('Select at least one risk.');
      const records = selected.map((row, i) => {
        if (RISK_COLUMNS.some(c => c.required && !String(row[c.key] ?? '').trim())) throw new Error(`Risk ${row.reference || i+1}: complete the required fields, including owner and ratings.`);
        const payload = prepareRisk({ ...Object.fromEntries(RISK_COLUMNS.filter(c => c.type !== 'calculated').map(c => [c.key, row[c.key] ?? ''])), anticipated_cost: row.anticipated_cost === '' || row.anticipated_cost == null ? null : Number(row.anticipated_cost), project_id: project.id, client_account_id: project.client_account_id, bdm_aad_id: project.bdm_aad_id });
        return Object.fromEntries(Object.entries(payload).filter(([, value]) => value != null));
      });
      const refs = records.map(r => r.reference.trim());
      if (new Set(refs).size !== refs.length) throw new Error('Each selected risk must have a unique reference.');
      const existing = await base44.entities.ProjectRisk.count({ project_id: project.id, reference: { $in: refs } });
      if (existing) throw new Error('Some references already exist in this project. Change their references or deselect those rows; existing risks will not be overwritten.');
      await base44.entities.ProjectRisk.bulkCreate(records.map((r, i) => ({ ...r, reference: refs[i] })));
      setReview(false); setRows([]); setFile(null); setNotice(`${records.length} risks added to the register.`); onImported();
    } catch (e) { setError(e.response?.data?.error || e.message || 'Unable to save risks.'); }
    finally { setBusy(''); }
  };
  return { file, setFile, rows, note, busy, error, notice, review, setReview, analyse, change, save };
}