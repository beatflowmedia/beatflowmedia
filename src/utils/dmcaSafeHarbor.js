// src/utils/dmcaSafeHarbor.js
//
// DMCA § 512(c) safe harbour: the conditions, and whether BFMG currently meets them.
//
// WHAT THE SAFE HARBOUR IS
// 17 U.S.C. § 512(c) shields a service provider from monetary liability for
// copyright infringement committed BY ITS USERS. It is not automatic. It is a
// bargain: the provider gets immunity in exchange for meeting conditions, and a
// provider that misses one is exposed as if the statute did not exist.
//
// WHY THIS MATTERS THE MOMENT UPLOADS OPEN
// Today BFMG publishes only its own catalogue, so there are no users to be shielded
// from. The instant artists can upload, BFMG becomes a host of third-party material
// and its liability changes character completely -- from "we chose what to publish"
// to "someone else put it there". The safe harbour is what makes that survivable,
// and it must be in place BEFORE the first upload, not after the first notice.
//
// THE THREE CONDITIONS, and none of them is optional:
//
//   1. DESIGNATED AGENT. An agent to receive infringement notices, REGISTERED with
//      the U.S. Copyright Office and PUBLISHED on the site. Both. Registration costs
//      $6 and takes about twenty minutes; it is the cheapest legal protection
//      available to this platform by a wide margin.
//
//   2. REPEAT-INFRINGER POLICY. Adopted, users informed of it, and -- the part that
//      gets litigated -- REASONABLY IMPLEMENTED. Courts have stripped the harbour
//      from providers that had a written policy and did not actually act on it. A
//      policy nobody enforces is worse than none, because it is evidence you knew
//      what to do.
//
//   3. EXPEDITIOUS REMOVAL on a valid notice.
//
// Plus two disqualifiers: actual or "red flag" knowledge of specific infringement,
// and financial benefit directly attributable to infringing activity the provider
// had the right and ability to control. Deliberately avoiding knowledge counts AS
// knowledge -- willful blindness defeats the harbour.
//
// THIS MODULE REFUSES TO CLAIM COMPLIANCE IT CANNOT SEE.
// The agent details below are real-world facts nobody can derive from code. They are
// null until a human fills them in, and safeHarborStatus() reports NOT eligible
// while they are. Same pattern as the null-versioned agreements in agreements.js: an
// unearned claim of protection is worse than an obvious gap, because it stops anyone
// looking.

/**
 * The designated agent, as registered with the U.S. Copyright Office.
 *
 * ALL FIELDS ARE NULL UNTIL REGISTRATION IS DONE. Filling them in here without
 * having registered would publish an agent the Office has no record of, which
 * satisfies the "published" half of the condition and fails the half that matters.
 *
 * Register at: https://dmca.copyright.gov/osp/
 */
const DESIGNATED_AGENT = {
  name: null,
  organization: null,
  address: null,
  phone: null,
  email: null,
  /** Date the Copyright Office registration was completed. */
  registeredWithCopyrightOffice: null,
  /** The Office requires re-registration every three years or the designation lapses. */
  renewalDue: null
};

/**
 * Repeat-infringer policy parameters.
 *
 * The statute sets no number -- "reasonably implemented" is the standard, and courts
 * assess conduct rather than counting. Three strikes is the common industry shape and
 * is recorded here so enforcement is consistent and reviewable, which is the part
 * that actually evidences reasonable implementation.
 */
const REPEAT_INFRINGER_POLICY = {
  /** Upheld notices before an account is terminated. */
  strikesBeforeTermination: 3,
  /** Rolling window in days over which strikes accumulate. */
  windowDays: 365,
  /** A strike is withdrawn if the uploader's counter-notice succeeds. */
  counterNoticeClearsStrike: true,
  /** Days a provider must wait after a counter-notice before restoring material,
   *  per § 512(g). Restoring sooner forfeits the protection the section gives. */
  counterNoticeWaitBusinessDaysMin: 10,
  counterNoticeWaitBusinessDaysMax: 14
};

const STRIKE_STATUS = {
  CLEAR: 'clear',
  WARNING: 'warning',
  TERMINATE: 'terminate'
};

/**
 * Where an uploader stands under the policy.
 *
 * Counts only strikes inside the rolling window, because a policy that never forgets
 * is not a repeat-infringer policy, it is a permanent record -- and one bad upload
 * three years ago should not terminate an otherwise clean account.
 *
 * @param {Array<{at: Date|string|number, withdrawn?: boolean}>} strikes
 * @param {Date} [now]
 */
function repeatInfringerStatus(strikes, now = new Date()) {
  const list = Array.isArray(strikes) ? strikes : [];
  const cutoff = now.getTime() - REPEAT_INFRINGER_POLICY.windowDays * 24 * 60 * 60 * 1000;

  const active = list.filter((s) => {
    if (!s || s.withdrawn) return false;
    const t = s.at instanceof Date ? s.at.getTime() : new Date(s.at).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });

  const count = active.length;
  const limit = REPEAT_INFRINGER_POLICY.strikesBeforeTermination;

  let status = STRIKE_STATUS.CLEAR;
  if (count >= limit) status = STRIKE_STATUS.TERMINATE;
  else if (count > 0) status = STRIKE_STATUS.WARNING;

  return {
    status,
    activeStrikes: count,
    strikesRemaining: Math.max(0, limit - count),
    mustTerminate: status === STRIKE_STATUS.TERMINATE
  };
}

/**
 * Whether BFMG currently qualifies for the § 512(c) safe harbour.
 *
 * Deliberately pessimistic: every unmet or unverifiable condition is reported as a
 * gap. It answers "can we prove this", not "do we think so".
 *
 * @param {object} [context]
 * @param {boolean} [context.acceptsUserUploads] - whether the harbour is needed yet
 * @param {boolean} [context.policyPublished] - is the repeat-infringer policy on the site
 * @param {boolean} [context.takedownProcessLive] - can a notice actually be actioned
 */
function safeHarborStatus(context = {}) {
  const gaps = [];

  if (!DESIGNATED_AGENT.registeredWithCopyrightOffice) {
    gaps.push('designated agent is not registered with the U.S. Copyright Office (dmca.copyright.gov/osp/, $6)');
  }
  if (!DESIGNATED_AGENT.email || !DESIGNATED_AGENT.name) {
    gaps.push('designated agent is not published on the site (name and contact required)');
  }
  if (!context.policyPublished) {
    gaps.push('repeat-infringer policy is not published where users are informed of it');
  }
  if (!context.takedownProcessLive) {
    gaps.push('no verified process for expeditious removal on a valid notice');
  }

  const eligible = gaps.length === 0;

  return {
    eligible,
    gaps,
    /** The harbour is only *needed* once third parties can upload. Before that the
     *  gaps are cheap to close; after it they are exposure. */
    required: !!context.acceptsUserUploads,
    urgent: !!context.acceptsUserUploads && !eligible
  };
}

module.exports = {
  DESIGNATED_AGENT,
  REPEAT_INFRINGER_POLICY,
  STRIKE_STATUS,
  repeatInfringerStatus,
  safeHarborStatus
};
