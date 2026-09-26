import { classifyLead } from './leadsService';

/**
 * Tell the team a lead arrived.
 *
 * FIRE AND FORGET, DELIBERATELY
 * -----------------------------
 * Never awaited by the submit path and never able to fail it. The lead is already in
 * Firestore and visible in the Leads tab before this runs, so the email is a
 * convenience and not the record. Making a sponsor's application fail because a mail
 * provider was slow would trade the thing that matters for the thing that does not.
 *
 * Urgency is computed by classifyLead, the same function the Leads tab uses, so the
 * subject line and the screen cannot disagree about which leads are hot.
 *
 * The recipient is NOT sent. The function reads it from the environment, because an
 * endpoint that accepts a "to" address and is callable by anonymous visitors is an
 * open relay.
 */
export function notifyLead(lead) {
  const payload = {
    kind: lead.kind,
    urgency: classifyLead(lead),
    name: lead.name,
    email: lead.email,
    company: lead.company,
    topic: lead.topic,
    detail: lead.detail,
    extras: lead.extras || []
  };

  try {
    const body = JSON.stringify(payload);

    // sendBeacon survives the page navigating away, which a submit often does. It is
    // the difference between a notification that arrives and one that is cancelled
    // mid-flight by the redirect that follows a successful application.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/.netlify/functions/notify-lead', blob)) return;
    }

    fetch('/.netlify/functions/notify-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch((err) => console.warn('[notifyLead] could not notify:', err.message));
  } catch (err) {
    console.warn('[notifyLead] could not notify:', err.message);
  }
}
