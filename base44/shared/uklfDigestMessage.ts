export function uklfDigestMessage(summary, now) {
  const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  const rate = (passed, recorded) => recorded ? `${Math.round(passed / recorded * 100)}% (${passed} of ${recorded} recorded)` : 'Not recorded';
  const rows = [
    ['Framework projects', summary.total], ['Linked to ALSight', summary.linked],
    ['Questionnaire dated', summary.questionnaire], ['Agreement signed', summary.agreement],
    ['Call-off dated', summary.calloff], ['Delivery outcome recorded', summary.outcomes],
    ['Completed on time', rate(summary.onTime, summary.onTimeRecorded)], ['Completed to budget', rate(summary.toBudget, summary.budgetRecorded)],
  ];
  const subject = `UKLF portfolio summary — ${month}`;
  const footer = 'Portfolio snapshot of recorded UK Leisure Framework workbook rows. Outcome rates use records with the relevant outcome recorded. Financial amounts and project-specific details are not included.';
  const text = `${subject}\nAs at ${date}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${footer}`;
  const html = `<h1>UKLF portfolio summary</h1><p>As at ${date}</p><table cellpadding="8" cellspacing="0">${rows.map(([label, value]) => `<tr><th align="left">${label}</th><td>${value}</td></tr>`).join('')}</table><p>${footer}</p>`;
  return { subject, text, html };
}