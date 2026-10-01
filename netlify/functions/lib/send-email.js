// netlify/functions/lib/send-email.js
//
// The one place this platform sends email from.
//
// WHY IT EXISTS
// There were two providers, and neither worked. notify-lead.js posted to Resend;
// stripe-webhook.js built a nodemailer transport against Gmail with an App Password.
// Resend had no key set in production, and the Gmail password was leaked into a
// transcript. So a lead notification silently did nothing and a payment-failure
// warning could not send at all -- two half-wired paths, each failing quietly in its
// own way, and no single place to look when mail stopped arriving.
//
// Gmail was the wrong second provider regardless of the leak. An App Password grants
// IMAP as well as SMTP, so a credential needed only to SEND one templated email also
// reads the mailbox. Resend's key sends and nothing else.
//
// ONE PROVIDER, ONE KEY, ONE FAILURE MODE.
//
// NEVER THROWS. Email is a notification, never the transaction. A webhook that fails
// because a warning email bounced turns a payment problem into a Stripe retry storm,
// and a lead form that 500s because an inbox is unreachable loses the lead it was
// trying to report. Callers get {sent:false, reason} and decide for themselves.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * @param {object} message
 * @param {string|string[]} message.to
 * @param {string} message.subject
 * @param {string} [message.text]
 * @param {string} [message.html]
 * @param {string} [message.from]   defaults to MAIL_FROM, then LEAD_NOTIFY_FROM
 * @param {string} [message.label]  prefix for log lines, so a failure names its caller
 * @returns {Promise<{sent: boolean, reason?: string, id?: string}>}
 */
async function sendEmail({ to, subject, text, html, from, label = 'send-email' }) {
  const apiKey = process.env.RESEND_API_KEY;

  // LEAD_NOTIFY_FROM is read as a fallback so this works before that variable is
  // renamed; the sender is not lead-specific and MAIL_FROM is the name that fits.
  const sender = from || process.env.MAIL_FROM || process.env.LEAD_NOTIFY_FROM;
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);

  const missing = [
    !apiKey && 'RESEND_API_KEY',
    !sender && 'MAIL_FROM',
    !recipients.length && 'a recipient'
  ].filter(Boolean);

  if (missing.length) {
    // Says what is missing, by NAME. "Email not configured" sends the reader to the
    // wrong place; naming the variable ends the search.
    console.error(`[${label}] not sent — missing: ${missing.join(', ')}`);
    return { sent: false, reason: 'not configured: ' + missing.join(', ') };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: sender,
        to: recipients,
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {})
      })
    });

    if (!response.ok) {
      const body = await response.text();
      // Status and Resend's message, never the key and never the recipient's details.
      console.error(`[${label}] Resend returned ${response.status}: ${body.slice(0, 500)}`);
      return { sent: false, reason: `provider ${response.status}` };
    }

    const data = await response.json().catch(() => ({}));
    return { sent: true, id: data.id };
  } catch (err) {
    console.error(`[${label}] send failed: ${err.message}`);
    return { sent: false, reason: 'send failed' };
  }
}

module.exports = { sendEmail };
