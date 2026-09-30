export function uklfDigestMessage(summary, now, activity) {
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  const rate = (passed, recorded) => recorded ? `${Math.round(passed / recorded * 100)}% (${passed} of ${recorded} recorded)` : 'Not recorded';
  const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
  const value = activity.dmaCount && !activity.valuedProjects ? 'Not recorded' : currency.format(activity.calloffValue);
  const highlights = [
    ['New projects · questionnaire approved', activity.approved],
    ['DMAs executed', activity.dmaCount],
    ['Framework call-off value · executed DMAs', value],
  ];
  const rows = [
    ['Framework projects', summary.total], ['Linked to ALS Live', summary.linked],
    ['Questionnaire dated', summary.questionnaire], ['Agreement signed', summary.agreement],
    ['Call-off dated', summary.calloff], ['Delivery outcome recorded', summary.outcomes],
    ['Completed on time', rate(summary.onTime, summary.onTimeRecorded)], ['Completed to budget', rate(summary.toBudget, summary.budgetRecorded)],
  ];
  const subject = `UKLF monthly digest — ${activity.month}`;
  const method = 'New projects use UKLF project questionnaire approval dates. DMAs use execution dates. Values sum recorded framework call-off amounts for linked projects. Call-off records are included once even where multiple DMAs were executed for the same project. All monthly dates use UK time.';
  const gaps = activity.missingValues ? `${activity.missingValues} project(s) with executed DMAs have no linked call-off value and are excluded from the value total.` : '';
  const footer = 'Portfolio totals are a snapshot as at the date above; monthly highlights cover the named reporting month. Scheduled digests report the previous completed month; test digests show the current month to date.';
  const text = `ALS Live | UK Leisure Framework\n${subject}\nAs at ${date}\n\nMONTHLY HIGHLIGHTS\n${highlights.map(([label, amount]) => `${label}: ${amount}`).join('\n')}\n\nPORTFOLIO OVERVIEW\n${rows.map(([label, amount]) => `${label}: ${amount}`).join('\n')}\n\n${method}\n${gaps}\n${footer}`;
  const logo = 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/7f98df654_ALSight_brand_aligned_transparent.png';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:Arial,Helvetica,sans-serif;color:#161442;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;">
<tr><td style="background:#161442;padding:28px 28px 22px;border-bottom:4px solid #f7931e;">
<img src="${logo}" width="190" alt="ALS Live — Alliance Leisure" style="display:block;width:190px;max-width:100%;height:auto;">
<p style="margin:18px 0 0;color:#ffffff;font-size:13px;letter-spacing:2px;">UK LEISURE FRAMEWORK</p>
<h1 style="margin:8px 0;color:#ffffff;font-size:26px;line-height:1.3;">Monthly portfolio digest</h1>
<p style="margin:0;color:#f7931e;font-size:16px;">${activity.month}</p></td></tr>
<tr><td style="padding:24px 28px;"><p style="margin:0 0 22px;color:#66667a;font-size:13px;">As at ${date}</p>
<h2 style="font-size:18px;margin:0 0 12px;">Monthly highlights</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${highlights.map(([label, amount]) => `<tr><td style="padding:16px 18px;background:#f4f5f8;border-bottom:6px solid #ffffff;font-size:14px;">${label}<br><strong style="font-size:28px;line-height:1.6;color:#161442;">${amount}</strong></td></tr>`).join('')}</table>
<h2 style="font-size:18px;margin:24px 0 12px;">Portfolio overview</h2>
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows.map(([label, amount]) => `<tr><th scope="row" align="left" style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:400;">${label}</th><td align="right" style="padding:12px 0 12px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;">${amount}</td></tr>`).join('')}</table>
${gaps ? `<p style="font-size:12px;line-height:1.6;color:#66667a;">${gaps}</p>` : ''}</td></tr>
<tr><td style="padding:22px 28px;background:#f4f5f8;font-size:12px;line-height:1.6;color:#66667a;"><strong style="color:#161442;">ALS Live · Alliance Leisure</strong><p>${method}</p><p style="margin-bottom:0;">${footer} Outcome rates use projects with the relevant outcome recorded.</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}