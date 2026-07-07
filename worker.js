/**
 * Citadel Digital — Contact Form Worker
 *
 * Receives POST requests from the contact form on citadeldigital.com,
 * then sends an email via Resend.
 *
 * Environment variables (set in Cloudflare dashboard → Worker → Settings → Variables):
 *   RESEND_API_KEY  — your Resend API key (mark as Secret)
 *   FROM_EMAIL      — sender address, e.g. "onboarding@resend.dev" or "hello@citadeldigital.com"
 *   TO_EMAIL        — your inbox, e.g. "henry@citadeldigital.com"
 */

const ALLOWED_ORIGINS = [
  'https://hwfl850.github.io',
  'https://citadeldigital.com',
  'https://www.citadeldigital.com',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function buildEmailHtml({ firstName, lastName, email, phone, service, message }) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0b1120;padding:28px 36px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3b82f6;">Citadel Digital</p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">New consultation request</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">First Name</p>
                  <p style="margin:0;font-size:15px;color:#0f172a;">${esc(firstName)}</p>
                </td>
                <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Last Name</p>
                  <p style="margin:0;font-size:15px;color:#0f172a;">${esc(lastName)}</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Email</p>
                  <p style="margin:0;font-size:15px;color:#0f172a;"><a href="mailto:${esc(email)}" style="color:#2563eb;">${esc(email)}</a></p>
                </td>
                <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Phone</p>
                  <p style="margin:0;font-size:15px;color:#0f172a;">${esc(phone) || '<span style="color:#94a3b8;">Not provided</span>'}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-bottom:20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Service of Interest</p>
                  <p style="margin:0;font-size:15px;color:#0f172a;">${esc(service) || '<span style="color:#94a3b8;">Not specified</span>'}</p>
                </td>
              </tr>
            </table>

            <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Message</p>
              <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.7;white-space:pre-wrap;">${esc(message) || '<span style="color:#94a3b8;">No message provided</span>'}</p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">This message was submitted via the contact form at citadeldigital.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
    }

    const { firstName, lastName, email, phone, service, message } = body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return jsonResponse({ error: 'firstName, lastName and email are required' }, 400, origin);
    }

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject: `New consultation request from ${firstName} ${lastName}`,
        html: buildEmailHtml({ firstName, lastName, email, phone, service, message }),
      }),
    });

    if (!resendRes.ok) {
      let errMsg = 'Failed to send email';
      try { const err = await resendRes.json(); errMsg = err.message ?? errMsg; } catch {}
      console.error('Resend error:', errMsg);
      return jsonResponse({ error: 'Failed to send message. Please try again.' }, 500, origin);
    }

    return jsonResponse({ ok: true }, 200, origin);
  },
};
