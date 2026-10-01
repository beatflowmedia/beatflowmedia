/**
 * Email the BFMG team when a lead arrives.
 *
 * SECURITY: THE RECIPIENT IS NOT AN INPUT
 * ---------------------------------------
 * This endpoint is callable by anyone who can load the site, because a lead can be
 * submitted without signing in. So the "to" address comes from LEAD_NOTIFY_TO in the
 * environment and NOTHING in the request body can change it. Accepting a recipient
 * would turn this into an open relay: anyone could send mail from our verified domain
 * to any address, which burns the domain's sending reputation and is a spam vector
 * that gets a Resend account closed.
 *
 * For the same reason the body is length-capped and rendered as text. A lead's own
 * words are pasted into an email we send to ourselves; unbounded input is how a
 * notification becomes a payload.
 *
 * NO SDK
 * ------
 * Resend's API is one authenticated POST, and Node 20 on Netlify has fetch. A
 * dependency for a single request is a version to keep current and a supply-chain
 * surface, for no gain.
 *
 * DEGRADES QUIETLY, ON PURPOSE
 * ----------------------------
 * If RESEND_API_KEY is absent this returns 200 and logs that it did nothing. The
 * caller is a fire-and-forget notification attached to a lead submission: a missing
 * key must never turn a successful application into a failed one. The lead is already
 * in Firestore and visible in the Leads tab before this is ever called -- the email is
 * a convenience, not the record.
 *
 * SETUP REQUIRED (none of which is done yet):
 *   RESEND_API_KEY    from resend.com, for the BFMG account
 *   LEAD_NOTIFY_TO    where notifications go
 *   LEAD_NOTIFY_FROM  an address on a domain VERIFIED in Resend. Sending from an
 *                     unverified domain fails, and sending from gmail.com will be
 *                     rejected outright by Resend and by receiving servers.
 */

const MAX_FIELD = 2000;

/** Trim to a sane length and strip control characters. */
function clean(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, MAX_FIELD);
}

const { sendEmail } = require('./lib/send-email');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  const from = process.env.LEAD_NOTIFY_FROM;

  if (!apiKey || !to || !from) {
    // Named individually so the log says WHICH one is missing. "Email not configured"
    // sends someone reading logs to check all three.
    console.log(
      '[notify-lead] skipped - missing ' +
        [!apiKey && 'RESEND_API_KEY', !to && 'LEAD_NOTIFY_TO', !from && 'LEAD_NOTIFY_FROM']
          .filter(Boolean)
          .join(', ')
    );
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'not configured' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const urgency = clean(payload.urgency) || 'warm';
  const kind = clean(payload.kind) || 'enquiry';
  const company = clean(payload.company);
  const name = clean(payload.name);
  const email = clean(payload.email);
  const topic = clean(payload.topic);
  const detail = clean(payload.detail);
  const extras = Array.isArray(payload.extras)
    ? payload.extras.slice(0, 12).map((row) => [clean(row[0]), clean(row[1])])
    : [];

  const subject =
    `[${urgency.toUpperCase()}] ${kind === 'sponsorship' ? 'Sponsorship' : 'Enquiry'}` +
    (company ? ` - ${company}` : '');

  const lines = [
    subject,
    '',
    `From:    ${name || '(no name)'}`,
    `Email:   ${email || '(none given)'}`,
    `Company: ${company || '(none given)'}`,
    `About:   ${topic || '(not stated)'}`,
    ''
  ];
  extras.filter(([, value]) => value).forEach(([label, value]) => {
    lines.push(`${label}: ${value}`);
  });
  if (detail) {
    lines.push('', 'What they said:', detail);
  }
  lines.push('', 'Open the Leads tab in the admin dashboard to action this.');

  // Sent through lib/send-email.js. This file used to POST to Resend itself, and when
  // stripe-webhook.js needed to send too, the choice was a second copy of this block or
  // one sender. The copy would have been the third mail implementation in the repo.
  const result = await sendEmail({
    label: 'notify-lead',
    to,
    from,
    subject,
    text: lines.join('\n')
  });

  if (!result.sent) {
    // Still 200. A lead form that 500s because an inbox is unreachable loses the lead
    // it was reporting -- the record is already written, the email is the notification.
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: result.reason }) };
  }

  // No try/catch here any more: sendEmail never throws. It returns {sent, reason} and
  // logs its own failures, so a caller cannot forget to handle one.
  return { statusCode: 200, body: JSON.stringify({ sent: true, id: result.id }) };
};
