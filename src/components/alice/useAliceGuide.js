import { useState } from 'react';
import { GUIDES, saveGuide } from '@/components/alice/aliceGuides';

export default function useAliceGuide(user) {
  const [guide, setGuide] = useState(null);
  const start = type => setGuide({ type, step: 0, answers: {}, transcript: [{ role: 'assistant', content: GUIDES[type].steps[0].question }], saving: false, error: '', result: null });
  const cancel = () => setGuide(null);
  const next = value => {
    if (!guide || guide.saving) return;
    const field = GUIDES[guide.type].steps[guide.step];
    if (!field.optional && !String(typeof value === 'object' ? value?.name || '' : value || '').trim()) { setGuide(g => ({ ...g, error: 'Please answer this question to continue.' })); return; }
    if (field.type === 'number' && value && (!Number.isFinite(Number(value)) || Number(value) < 0)) { setGuide(g => ({ ...g, error: 'Enter a valid amount of zero or more.' })); return; }
    const answers = { ...guide.answers, [field.key]: value };
    const step = guide.step + 1;
    const question = GUIDES[guide.type].steps[step]?.question || 'Here is what I have. Shall I save it?';
    setGuide(g => ({ ...g, answers, step, error: '', transcript: [...g.transcript, { role: 'user', content: typeof value === 'object' ? value?.name : String(value || 'Skipped') }, { role: 'assistant', content: question }] }));
  };
  const back = () => {
    if (!guide || guide.step === 0 || guide.saving) return;
    const step = guide.step - 1;
    setGuide(g => ({ ...g, step, error: '', transcript: [...g.transcript, { role: 'assistant', content: `Let's revisit that. ${GUIDES[g.type].steps[step].question}` }] }));
  };
  const confirm = async () => {
    if (!guide || guide.saving) return;
    setGuide(g => ({ ...g, saving: true, error: '' }));
    try {
      const result = await saveGuide(guide.type, guide.answers, user);
      setGuide(g => ({ ...g, saving: false, result, transcript: [...g.transcript, { role: 'assistant', content: result.message }] }));
    } catch (e) { setGuide(g => ({ ...g, saving: false, error: e.message || 'Unable to save. Please try again.' })); }
  };
  return { guide, start, cancel, next, back, confirm };
}