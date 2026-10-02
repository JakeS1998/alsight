export function riskApprovalInvitationMessage(packet, step, party, link) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const date = new Date(packet.issued_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London', timeZoneName: 'short' });
  const decision = packet.steps.length === 1 ? 'Your decision is recorded independently; no other party has to approve first.' : 'Acceptance invites the next party; declining stops this earlier sequential issue.';
  const instructions = 'Sign in with this registered email address, request a verification code, then review the full issued register and explicitly accept or decline it.';
  const disclaimer = 'This is a recorded approval, not an Adobe-style digital signature.';
  const subject = `Risk register acceptance required — ${packet.reference}`;
  const text = `ALSight | Risk register acceptance\n\nYou are the ${party} reviewer for ${packet.project_name}.\n\n${packet.issued_by_name} issued the locked register ${packet.reference} on ${date}.\n\nReview risk register: ${link}\n\n${instructions}\n\n${decision}\n\n${disclaimer}`;
  const logo = 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/7f98df654_ALSight_brand_aligned_transparent.png';
  const rows = [['Project', packet.project_name], ['Register reference', packet.reference], ['Your review role', party], ['Issued by', packet.issued_by_name], ['Issued on', date]];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:Arial,Helvetica,sans-serif;color:#161442;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;">
<tr><td style="background:#161442;padding:28px;border-bottom:4px solid #f7931e;">
<img src="${logo}" width="190" alt="ALSight — Alliance Leisure" style="display:block;width:190px;max-width:100%;height:auto;">
<p style="margin:20px 0 8px;color:#f7931e;font-size:12px;letter-spacing:2px;">RISK REGISTER</p>
<h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.3;">Acceptance required</h1></td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${escape(step.name)},</p>
<p style="margin:0 0 22px;font-size:15px;line-height:1.6;">You have been invited to review and record your acceptance of the issued risk register for <strong>${escape(packet.project_name)}</strong>.</p>
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows.map(([label, value]) => `<tr><th scope="row" align="left" valign="top" style="padding:12px 12px 12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:400;color:#66667a;">${label}</th><td valign="top" style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;word-break:break-word;">${escape(value)}</td></tr>`).join('')}</table>
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0;"><tr><td align="center" bgcolor="#f7931e" style="background:#f7931e;border-radius:6px;"><a href="${escape(link)}" style="display:inline-block;padding:15px 24px;border:1px solid #f7931e;border-radius:6px;color:#161442;font-size:15px;font-weight:700;text-decoration:none;mso-padding-alt:0;"><!--[if mso]><i style="mso-font-width:150%;mso-text-raise:24pt;" hidden>&emsp;</i><![endif]-->Review risk register<!--[if mso]><i style="mso-font-width:150%;" hidden>&emsp;&#8203;</i><![endif]--></a></td></tr></table>
<h2 style="margin:0 0 10px;font-size:17px;">Review securely in ALSight</h2>
<p style="margin:0 0 14px;font-size:14px;line-height:1.7;">${instructions}</p>
<p style="margin:0;padding:16px;background:#f4f5f8;border-left:3px solid #f7931e;font-size:13px;line-height:1.7;">${decision}</p>
<p style="margin:22px 0 0;color:#66667a;font-size:12px;line-height:1.6;">If the button does not work, <a href="${escape(link)}" style="color:#161442;text-decoration:underline;">open the secure review page</a>.</p></td></tr>
<tr><td style="padding:22px 28px;background:#f4f5f8;color:#66667a;font-size:12px;line-height:1.6;"><strong style="color:#161442;">ALSight · Alliance Leisure</strong><p style="margin:8px 0 0;">${disclaimer}</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}