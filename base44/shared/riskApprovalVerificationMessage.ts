export function riskApprovalVerificationMessage(packet, code) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const subject = `ALSight verification code — ${packet.reference}`;
  const text = `Your risk-register verification code is ${code}. It expires in 10 minutes. This code verifies your review of ${packet.reference} for ${packet.project_name}; it is not a portal login code. Do not share it.`;
  const logo = 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/7f98df654_ALSight_brand_aligned_transparent.png';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:Arial,Helvetica,sans-serif;color:#161442;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;">
<tr><td style="background:#161442;padding:28px;border-bottom:4px solid #f7931e;">
<img src="${logo}" width="190" alt="ALSight — Alliance Leisure" style="display:block;width:190px;max-width:100%;height:auto;">
<p style="margin:20px 0 8px;color:#f7931e;font-size:12px;letter-spacing:2px;">RISK REGISTER</p>
<h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.3;">Your verification code</h1></td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 22px;font-size:15px;line-height:1.7;">Enter the code below on your ALSight risk-register review page to verify your review.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px;background:#f4f5f8;border-top:3px solid #f7931e;"><p style="margin:0;color:#161442;font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;line-height:1.4;">${escape(code)}</p><p style="margin:12px 0 0;color:#66667a;font-size:13px;">Expires in 10 minutes</p></td></tr></table>
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;"><tr><th scope="row" align="left" valign="top" style="padding:12px 12px 12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:400;color:#66667a;">Project</th><td valign="top" style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;word-break:break-word;">${escape(packet.project_name)}</td></tr><tr><th scope="row" align="left" valign="top" style="padding:12px 12px 12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:400;color:#66667a;">Register reference</th><td valign="top" style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;word-break:break-word;">${escape(packet.reference)}</td></tr></table>
<p style="margin:22px 0 0;padding:16px;background:#f4f5f8;border-left:3px solid #f7931e;font-size:13px;line-height:1.7;"><strong>Keep this code private.</strong> It verifies your review of this issued risk register; it is not a portal login code. Do not share it.</p></td></tr>
<tr><td style="padding:22px 28px;background:#f4f5f8;color:#66667a;font-size:12px;line-height:1.6;"><strong style="color:#161442;">ALSight · Alliance Leisure</strong><p style="margin:8px 0 0;">Risk register review verification</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}