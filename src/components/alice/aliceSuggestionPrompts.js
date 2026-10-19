import { GUIDES } from '@/components/alice/aliceGuides';

const questions = ['Summarise a project', 'Summarise portfolio risks', 'Find a contact', 'Draft a follow up', 'Upcoming completions', 'Fee proposals', 'Which approvals are waiting for me?', 'Which projects have recorded attention signals?', 'What are my next actions?'];
const workspace = ['Which projects have recorded attention signals?', 'Which approvals are waiting for me?', 'Which recorded deadlines should I be aware of?', 'What project record updates are visible?', 'What should I prepare for my next working day?'];
const framework = ['Which projects are not linked?', 'Which agreements are missing?', 'Which outcomes require review?', 'What proportion of recorded outcomes were on time?', 'What is the aggregate Total Call-Off Value?', 'What recent activity is recorded?'];
const form = ['Set the project to ', 'Set the client to ', 'Set the owner to ', 'Set the due date to ', 'Add a note: ', 'Fill the matching fields using these details: '];
const brief = ['The project involves ', 'The client is ', 'The proposed site is ', 'The scope of works includes ', 'The target completion date is '];
const commands = { project: 'Create a project request', opportunity: 'Log a new opportunity', risk: 'Add a project risk', comment: 'Add a project comment', action: 'Add a project action', decision: 'Record a project decision', valuation: 'Create a project valuation' };
const clean = text => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

export default function aliceSuggestionPrompts(value, mode, role, widgets = []) {
  const input = clean(value);
  if (input.length < 2) return [];
  const texts = mode === 'framework' ? framework : mode === 'form' ? form : mode === 'brief' ? brief : ['workspace', 'insight'].includes(mode) ? workspace : questions;
  const candidates = texts.map(text => ({ text, kind: 'Question', terms: text }));
  if (mode === 'form' || mode === 'brief') candidates.forEach(item => { item.kind = 'Completion'; });
  if (mode === 'general') Object.entries(commands).forEach(([key, text]) => {
    if (GUIDES[key]?.roles.includes(role)) candidates.push({ text, kind: 'Command', terms: `${text} ${GUIDES[key].label} new add create log record ${key}` });
  });
  if (mode === 'workspace') {
    widgets.forEach(widget => ['Pin', 'Show', 'Hide'].forEach(verb => candidates.push({ text: `${verb} ${widget}`, kind: 'Command', terms: `${verb} ${widget}` })));
    candidates.push({ text: 'Restore my default workspace layout', kind: 'Command', terms: 'restore reset default workspace layout' });
  }
  const words = input.split(' ').filter(word => !['a', 'an', 'the', 'my', 'me', 'to', 'for', 'please'].includes(word));
  const endings = { 'what is': 'the recorded project status?', 'what should': 'I prepare for my next working day?', 'help me': 'summarise the recorded project risks', 'can you': 'summarise the recorded risks and next actions?', 'could you': 'summarise the recorded risks and next actions?', 'show me': 'the recorded risks and outstanding actions', 'tell me': 'about the recorded project status', 'what are': 'my next actions?', 'i need': 'a summary of the recorded project risks', 'please': 'summarise the recorded project status' };
  if (['general', 'workspace', 'insight'].includes(mode)) {
    if (endings[input]) candidates.push({ text: `${value.trimEnd()} ${endings[input]}`, kind: 'Completion', terms: input });
    if (/^(summarise|summarize|tell me about|what is the status of)\s+\S.{2,}$/i.test(value.trim()) && !/[?!.]$/.test(value.trim())) candidates.push({ text: `${value.trimEnd()}, including recorded risks and outstanding actions`, kind: 'Completion', terms: input });
  }
  const matches = candidates.filter(item => clean(item.text) !== input && (clean(item.text).startsWith(input) || (words.length && words.every(word => clean(item.terms).split(' ').some(part => part.startsWith(word))))));
  return matches.map(item => ({ ...item, kind: clean(item.text).startsWith(input) ? 'Completion' : item.kind, value: item.text }))
    .sort((a, b) => Number(b.kind === 'Completion') - Number(a.kind === 'Completion')).slice(0, 4);
}