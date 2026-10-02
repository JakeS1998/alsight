import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { GUIDES } from '@/components/alice/aliceGuides';
import HelpArticles from '@/components/help/HelpArticles';
const articles = [
  { title: 'Ask ALICE about project information', steps: ['Open the ALICE button at the bottom-right of the portal.', 'Ask a clear question and identify the project by name or number. For example: “What is recorded for the practical completion date on [project]?”', 'Read the answer and check the source records. On ALICE Insight cards, use View evidence where provided.', 'Use End chat to clear the current conversation and start fresh. Closing the panel alone does not end the chat.'], note: 'ALICE is intended to explain recorded information, not decide what should happen next. Missing evidence or Insufficient Data should not be interpreted as a healthy project.' },
  { title: 'Use a guided task', steps: ['Choose an available task on the welcome screen, or select Start a task during a conversation.', 'Answer the questions and use the review / confirmation step before saving.', 'Follow the resulting record link and check the saved information.'], note: 'Available tasks depend on your role. A draft, a suggested entry or a conversation alone is not a saved record or an approval.' },
  { title: 'Get help filling a text field', steps: ['Select the text field you want help with on the page.', 'Open ALICE, optionally enter your drafting instructions, and choose Help fill selected text field.', 'Review the draft and use the available apply control to place it in the selected field.', 'Check and edit the text, then save the form using its own Save control.'], note: 'Applying draft text does not itself save the form. If the selected field is no longer available, select it again.' },
  { title: 'Use ALICE imports and understand its limits', steps: ['Use ALICE: Import risk register in the risk register to interpret supported files.', 'Review all proposed rows, values, owners and scores before confirming an import. Use the limits and supported formats displayed in the import form.', 'Check source documents and recorded evidence before relying on summaries or calculations.', 'For access issues, incorrect source data or approvals that need changing, use the responsible person or portal administrator rather than asking ALICE to override them.'], note: 'ALICE does not replace professional, legal, commercial or statutory judgement, issue contractual authority or grant access to restricted records. You remain responsible for reviewing and confirming information.' },
];
export default function HelpAlice() {
  const { user } = useAuth();
  const tasks = Object.values(GUIDES).filter(item => item.roles.includes(user?.role));
  return <div className="space-y-5">
    <section className="rounded-xl border border-border border-l-2 border-l-primary bg-card p-5"><h2 className="flex items-center gap-2 font-heading text-xl font-bold text-als-navy"><Sparkles className="h-5 w-5 text-primary" />Meet ALICE</h2><p className="mt-2 text-sm text-muted-foreground">Alliance Leisure Intelligence &amp; Construction Expert — the portal’s project-information and drafting assistant. ALICE explains. People decide.</p>
      {user?.role === 'framework_stakeholder' ? <p className="mt-3 text-sm">The ALICE chat panel is not available in the framework stakeholder view.</p> : <p className="mt-3 text-sm">Open ALICE using the button at the bottom-right of the page.</p>}
      {tasks.length > 0 && <div className="mt-4"><h3 className="text-sm font-bold">Guided tasks available to your role</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{tasks.map(task => <li key={task.label}>{task.label}</li>)}</ul></div>}
    </section>
    <HelpArticles articles={articles} />
  </div>;
}