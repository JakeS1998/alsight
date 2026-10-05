const project = { key: 'project_id', type: 'project', question: 'Which project is this for? Select the correct project here.' };
const roles = ['admin', 'director', 'bdm', 'bsm'];
export default {
  action: { label: 'Add a project action', roles, steps: [project,
    { key: 'action', question: 'What action would you like to record?' },
    { key: 'owner', type: 'owner', question: 'Who owns this action? Choose their full name.', optional: true },
    { key: 'due_date', type: 'date', question: 'When is it due?', optional: true },
    { key: 'priority', type: 'choice', options: ['low', 'medium', 'high'], question: 'What priority should it have?', optional: true },
    { key: 'comments', question: 'Any supporting comments?', optional: true },
  ] },
  decision: { label: 'Record a project decision', roles, steps: [project,
    { key: 'decision_title', question: 'What is the decision about?' },
    { key: 'decision', question: 'What decision or outcome would you like to record?', optional: true },
    { key: 'decision_maker', question: 'Who is the decision maker?', optional: true },
    { key: 'required_by', type: 'date', question: 'When is the decision required?', optional: true },
    { key: 'status', type: 'choice', options: ['open', 'agreed'], question: 'Is this decision still open, or already agreed?' },
    { key: 'date_agreed', type: 'date', question: 'If agreed, what is the agreement date?', optional: true },
    { key: 'financial_adjustment', type: 'signed_number', question: 'What is the contract adjustment in pounds? Positive for additions, negative for omissions, or zero. Only agreed decisions affect contract totals.', optional: true },
    { key: 'financial_impact', question: 'Any financial impact notes?', optional: true },
    { key: 'programme_impact', question: 'Any programme impact to record?', optional: true },
  ] },
  valuation: { label: 'Submit a project valuation', roles: [...roles, 'finance', 'regional_director', 'supplier', 'project_manager'], steps: [
    { ...project, type: 'valuation_project' },
    { key: 'valuation', type: 'valuation', question: 'Your project is selected. Complete or select your valuation below, attach the required evidence, then submit. Your existing permissions and checks still apply.' },
  ] },
};