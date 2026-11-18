import React, { lazy, Suspense } from 'react';
import { focuses } from '@/components/adaptive/adaptiveEngine';
import { focusTargets } from '@/components/adaptive/AdaptiveFocusNav';
import AdaptiveWorkspaceColumns from '@/components/adaptive/AdaptiveWorkspaceColumns';
import PersonalWorkspace from '@/components/adaptive/PersonalWorkspace';
import '@/components/adaptive/adaptive-focus-tabs.css';
const TodayNotes = lazy(() => import('@/components/adaptive/notes/TodayNotes'));

export default function AdaptiveFocusContent(props) {
  const { focus, data, actions, context, prefs, intelligence } = props;
  return <section id="adaptive-focus-panel" role="tabpanel" aria-labelledby={`adaptive-focus-tab-${focuses.indexOf(focus)}`} tabIndex={0} className="at-focus-panel">
    {focus === 'My Notes' ? <Suspense fallback={<p role="status">Opening My Notes…</p>}><TodayNotes userId={props.user.id} /></Suspense> : focus === 'My priorities'
      ? <AdaptiveWorkspaceColumns {...props} />
      : <PersonalWorkspace data={data} actions={actions} context={context} focus={focus} prefs={prefs} intelligence={intelligence} selectedWidget={focusTargets[focus]} />}
  </section>;
}