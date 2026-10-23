// src/utils/ops.js
//
// WHAT AN OPS ITEM IS, defined once. The vocabulary for BFMG's ops desk.
//
// Adapted from the station's radio/ops.js, which Percy already uses and already
// approves incidents through. The SHAPE is deliberately the same -- same statuses, same
// transitions, same "only Percy decides" rule -- because Percy reads both desks and two
// dialects of the same workflow is a tax paid every time he switches.
//
// WHAT IS DIFFERENT, AND WHY, because a straight copy would be the wrong product:
//
//   AREAS mirror THIS domain, not the station's. The station reviews `listener`,
//   `engine`, `desk`, `social`. BFMG sells licences, so its areas are the places money
//   and rights move. Inventing the station's vocabulary here would be exactly the
//   Semantic Intent caveat: names that match nothing in the product.
//
//   CHECKS are a first-class kind of item, which the station has no equivalent for.
//   BFMG already owns 20 `verify:*` reconcilers whose output currently dies in a
//   terminal nobody is watching. The station's ops page is empty until agents run;
//   this one is useful on day one because the checks already exist.
//
//   SEVERITY gains a MONEY dimension in the guidance below rather than a new enum
//   value. A bug that takes a payment and delivers nothing is not the same "high" as a
//   mis-aligned card, and the areas encode that: `checkout` and `fulfilment` are where
//   a high means somebody paid and got nothing.
//
// STORAGE is Firestore (`opsItems`), not a git branch. The station chose a branch
// because it has no app and no auth, so git was the only thing already hosted. BFMG has
// both: /admin is behind isPlatformAdmin and the client already talks to Firestore, so a
// branch would mean building a GitHub reader to re-solve a solved problem. The trade is
// real and worth naming -- a branch gives free history and lets an agent write without
// credentials -- so `history` is kept ON the item rather than relying on the store.

/** Where a problem lives. Mirrors how BFMG actually breaks, not how the station does. */
const AREAS = {
  storefront: 'Browse, collection and track pages, the player, SEO and accessibility',
  checkout: 'Pricing, the licence clickwrap, create-checkout and Stripe sessions',
  fulfilment: 'Webhooks, purchase and licence records, entitlement, master delivery, revocation',
  catalogue: 'Songs, albums, collections, previewOnly, ISRC, and the radio sync contract',
  legal: 'Terms, licence agreements, privacy. Flagged for a lawyer, NEVER answered',
  // ADDED 2026-10-23. The global standard now requires a Calendar -- what posts, where,
  // when, and whether it actually happened -- and there was nowhere to file that. A
  // social-posting gap filed under `storefront` is mis-classified, and mis-classifying
  // to satisfy a validator is how a vocabulary stops describing the domain. The S pillar
  // puts it plainly: if a concern is not in the table, that is the finding.
  marketing: 'Blog, landing pages, social posting and the content calendar',
  quality: 'Tests, the verify:* reconcilers, the build, dependencies and CI'
};

const SEVERITIES = ['critical', 'high', 'medium', 'low'];

/**
 * Severity, stated in consequences rather than adjectives.
 *
 * Written down because "high" is the word every reporter reaches for, and a scale
 * nobody shares produces a queue sorted by how strongly each agent felt.
 */
const SEVERITY_MEANS = {
  critical: 'Money moves wrongly, a licence is granted or lost incorrectly, or a secret is exposed.',
  high: 'A buyer cannot complete or receive what they paid for, or a legal claim on the site is false.',
  medium: 'A real defect a user can hit, with a workaround or a limited blast radius.',
  low: 'Correct but untidy: drift, dead code, a stale document, a missing test.'
};

/** The life of an item, and who may move it. Agents file and fix; only Percy decides. */
const STATUSES = {
  open: { label: 'Needs your decision', by: 'agent' },
  approved: { label: 'Approved, waiting for the fixer', by: 'percy' },
  declined: { label: 'Declined', by: 'percy' },
  fixing: { label: 'Being fixed', by: 'fixer' },
  'fix-ready': { label: 'Fix ready for review', by: 'fixer' },
  'needs-human': { label: 'Fixer could not do it', by: 'fixer' },
  'merge-approved': { label: 'OK to merge: ask Claude to deploy', by: 'percy' },
  merged: { label: 'Merged', by: 'claude' },
  resolved: { label: 'Resolved', by: 'agent' }
};

const NEXT = {
  open: ['approved', 'declined', 'resolved'],
  approved: ['fixing', 'declined', 'needs-human'],
  fixing: ['fix-ready', 'needs-human', 'approved'],
  'fix-ready': ['merge-approved', 'declined', 'approved'],
  'needs-human': ['approved', 'declined', 'resolved'],
  'merge-approved': ['merged', 'fix-ready'],
  declined: ['open'],
  merged: [],
  resolved: ['open']
};

/** Statuses only Percy may set. The approval gate, enforced rather than documented. */
const DECIDED_BY_PERCY = new Set(['approved', 'declined', 'merge-approved']);

/**
 * Who does it. An item with an owner is Percy's own: a decision, a lawyer question, a
 * dashboard change only he can make. Agents never file, fix, approve or resolve one.
 *
 * This is the half of the station's design that pays off immediately here, because
 * BFMG's Percy-only backlog currently lives as prose inside a 4,000-line CLAUDE.md:
 * three unreviewed licence drafts, a Stripe price to change by hand, a Firestore
 * backfill, and "who locked production on 2026-10-15". A list he can see is the whole
 * point.
 */
const OWNERS = ['percy'];
const isPercys = (item) => !!item && item.owner === 'percy';

/**
 * KINDS. `incident` is a problem someone found. `check` is a reconciler that reports
 * for itself, and it exists because BFMG has 20 of them and the station has none.
 *
 * A check is NOT filed and NOT approved -- it is observed. It never enters the status
 * machine, which is why `problems()` validates it differently: demanding a severity and
 * a fingerprint from `npm run verify:csp` would be asking a thermometer for an opinion.
 */
const KINDS = ['incident', 'task', 'check'];

/** A filename- and id-safe identifier: date, area, and a slug of the title. */
function idFor(date, area, title) {
  const slug = String(title || '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  const areaSlug = String(area || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${String(date).slice(0, 10)}-${areaSlug}-${slug}`;
}

/**
 * Every problem with an ops record, or [] if it is well formed.
 *
 * Returns a LIST rather than a boolean, and rejecting with reasons is the point: an
 * agent that is told "invalid" files the same broken record again.
 */
function problems(item) {
  const out = [];
  if (!item || typeof item !== 'object') return ['not an object'];

  const kind = item.kind || 'incident';
  if (!KINDS.includes(kind)) out.push(`kind must be one of ${KINDS.join(', ')}`);

  // A check reports its own state and is never decided, so it is held to a different
  // contract. See the note on KINDS.
  if (kind === 'check') {
    for (const k of ['id', 'title', 'command']) {
      if (!item[k] || typeof item[k] !== 'string') out.push(`missing ${k}`);
    }
    if (item.area && !AREAS[item.area]) out.push(`unknown area ${item.area}`);
    if (item.state && !['pass', 'fail', 'unknown'].includes(item.state)) {
      out.push('state must be pass, fail or unknown');
    }
    return out;
  }

  // `fingerprint` is how an agent avoids filing the same root cause twice.
  const required = ['id', 'created', 'by', 'area', 'severity', 'title', 'what', 'status', 'fingerprint'];
  for (const k of required) {
    if (!item[k] || typeof item[k] !== 'string') out.push(`missing ${k}`);
  }

  if (item.id && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+$/.test(item.id)) {
    out.push('id must be date-area-slug, lowercase');
  }
  if (item.area && !AREAS[item.area]) {
    out.push(`area must be one of ${Object.keys(AREAS).join(', ')}`);
  }
  if (item.severity && !SEVERITIES.includes(item.severity)) {
    out.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  }
  if (item.status && !STATUSES[item.status]) out.push(`unknown status ${item.status}`);
  if (item.where && !Array.isArray(item.where)) out.push('where must be a list of file:line');
  if (item.history && !Array.isArray(item.history)) out.push('history must be a list');
  if (item.owner != null && !OWNERS.includes(item.owner)) {
    out.push(`owner must be one of ${OWNERS.join(', ')}`);
  }

  // `verified: false` is allowed and meaningful -- it marks a finding the agent could
  // not confirm. What is NOT allowed is omitting it, because then a guess and a proven
  // fact look identical in the queue, and the queue is what Percy decides from.
  if (kind === 'incident' && typeof item.verified !== 'boolean') {
    out.push('verified must be true or false — an unconfirmed finding must say so');
  }

  // LEGAL IS NEVER ANSWERED, only flagged. Same rule the station runs, and it matters
  // more here: BFMG has three published licences and no lawyer has read any of them.
  if (item.area === 'legal' && item.proposedFix && !item.forLawyer) {
    out.push('a legal item must set forLawyer: true rather than proposing an answer');
  }

  return out;
}

/* ---------------------------------------------------------------------------------
 * REFERENCE CODES — the short name you say out loud.
 *
 * An id like `2026-10-18-checkout-collection-price-mismatch` is precise, sortable and
 * useless in a sentence. "Do OPS-K7M4Q" is a thing you can say, put in a commit message,
 * or type into a search box.
 *
 * DERIVED FROM THE ID, NOT COUNTED. A sequential number (INC-001, INC-002) reads nicer,
 * and it needs a Firestore counter, which means an incident has no number until it has
 * been WRITTEN. That breaks exactly when it matters: this desk deliberately renders its
 * seeded backlog straight from the repository when Firestore is unreachable, so a
 * counted number would vanish in the degraded state it exists to survive. Two agents
 * filing at once would also need a transaction to avoid issuing the same number twice.
 *
 * A derived code exists the moment the item does, never changes, needs no write, and
 * cannot collide under concurrent filing. The cost is that it is not ordered — the id
 * already carries the date, so ordering was never this field's job.
 *
 * THE ALPHABET IS THE CERTIFICATE ALPHABET, not a new one. Crockford-ish base32 without
 * I, L, O or U, so a code read aloud or off a screen cannot be mistyped into a different
 * valid-looking one. netlify/functions/lib/license-certificate.js established it; a
 * second scheme would be two things to learn and two to get wrong.
 *
 * FIVE CHARACTERS, chosen by measurement rather than taste: over 5,000 realistic ids,
 * four characters collided 17 times and five collided zero. Two incidents sharing a
 * reference is the one failure this field cannot have.
 * ------------------------------------------------------------------------------- */

const REFERENCE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const REFERENCE_LENGTH = 5;

/** FNV-1a. Not a security hash and does not need to be: nothing is hidden by it, and
 *  it only has to spread ids evenly across the code space. */
function fnv1a(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * The short reference for an item, e.g. "OPS-K7M4Q".
 *
 * Stable for a given id, forever. Changing this function renumbers every incident that
 * was ever written down, so it is as close to a published contract as a pure function
 * gets.
 */
function referenceFor(id) {
  if (!id || typeof id !== 'string') return null;
  let hash = fnv1a(id);
  let out = '';
  for (let i = 0; i < REFERENCE_LENGTH; i += 1) {
    out += REFERENCE_ALPHABET[hash & 31];
    // Re-hash once the first 32 bits are spent, rather than repeating them.
    hash = hash >>> 5 || fnv1a(out + id);
  }
  return `OPS-${out}`;
}

/** Find an item by reference, so "resolve OPS-K7M4Q" can be acted on. Case-insensitive
 *  and tolerant of the prefix being left off, because both are how people will type it. */
function findByReference(items, reference) {
  if (!reference) return null;
  const wanted = String(reference).trim().toUpperCase().replace(/^OPS-/, '');
  return (items || []).find((i) => referenceFor(i.id) === `OPS-${wanted}`) || null;
}

/* ---------------------------------------------------------------------------------
 * SEARCH.
 *
 * TOKENISED AND ALL-MUST-MATCH, not a substring test. "stripe price" should find the
 * item titled "Change the Creator subscription price from $24 to $12 in Stripe" even
 * though those two words appear in the opposite order and nowhere adjacent. A plain
 * `includes(query)` finds nothing there, which teaches people the search is broken and
 * they stop using it.
 *
 * THE REFERENCE IS SEARCHABLE, which is half the point of having one. Pasting
 * OPS-X96P6 must land on that item, and so must typing x96p6 — the prefix is noise
 * people will leave off.
 *
 * FILE PATHS ARE SEARCHABLE TOO. "create-checkout" is how you would look for anything
 * touching the checkout function, and `where` is the only field holding it.
 * ------------------------------------------------------------------------------- */

/** Everything about an item that is worth matching against, flattened to one string. */
function searchableText(item) {
  if (!item) return '';
  const parts = [
    referenceFor(item.id) || '',
    item.id,
    item.title,
    item.what,
    item.note,
    item.area,
    item.severity,
    item.status,
    item.command,       // checks
    item.protects,      // checks
    item.detail,        // checks
    ...(Array.isArray(item.where) ? item.where : [])
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Does this item match every word in the query?
 *
 * An empty query matches everything, so a caller can pass the box's value straight in
 * without branching on "is the user searching".
 */
function matchesQuery(item, query) {
  const tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = searchableText(item);
  // Punctuation stripped from the TOKEN only: typing "OPS-X96P6" or "$24" should match
  // without the searcher having to know how the text was stored.
  return tokens.every((t) => {
    if (haystack.includes(t)) return true;
    const bare = t.replace(/[^a-z0-9]/g, '');
    return bare.length > 0 && haystack.replace(/[^a-z0-9 ]/g, '').includes(bare);
  });
}

/** Filter a list by the query, preserving its order. */
function searchItems(items, query) {
  return (items || []).filter((i) => matchesQuery(i, query));
}

/** Move an item to a new status, or throw saying why it may not. */
function transition(item, to, actor, note, at) {
  if (!STATUSES[to]) throw new Error(`unknown status ${to}`);
  if (!(NEXT[item.status] || []).includes(to)) {
    throw new Error(`cannot go from ${item.status} to ${to}`);
  }
  if (DECIDED_BY_PERCY.has(to) && actor !== 'percy') {
    throw new Error(`only Percy can set ${to}`);
  }
  if (isPercys(item) && actor !== 'percy') {
    throw new Error('this is Percy\'s own item; an agent may not move it');
  }
  const when = at || new Date().toISOString();
  return {
    ...item,
    status: to,
    history: [...(item.history || []), { at: when, status: to, by: actor, note: note || '' }]
  };
}

/**
 * Most urgent first: undecided before decided, then severity, then newest.
 *
 * Deliberately NOT sorted by severity alone. A critical that Percy already approved is
 * being handled; a low that nobody has looked at is still a question for him. The queue
 * is sorted by "does this need you", not by "how bad is it".
 */
function sort(list) {
  const stage = (s) => (
    s === 'open' ? 0
      : s === 'fix-ready' ? 1
        : s === 'needs-human' ? 2
          : (s === 'approved' || s === 'fixing' || s === 'merge-approved') ? 3
            : 4
  );
  return [...list].sort((a, b) => (
    stage(a.status) - stage(b.status)
    || SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity)
    || String(b.created).localeCompare(String(a.created))
  ));
}

/** Does this item still need Percy? Drives the badge count on the admin nav. */
function needsPercy(item) {
  if (!item) return false;
  if (item.kind === 'check') return item.state === 'fail';
  if (isPercys(item)) return item.status !== 'resolved' && item.status !== 'declined';
  return item.status === 'open' || item.status === 'fix-ready';
}

// CommonJS, matching utils/pricing.js, utils/agreements.js and utils/licenseTerms.js --
// the files the Netlify functions already require. An ops agent running under node must
// be able to validate a record before writing it, without a bundler.
module.exports = {
  AREAS,
  SEVERITIES,
  SEVERITY_MEANS,
  STATUSES,
  NEXT,
  OWNERS,
  KINDS,
  isPercys,
  idFor,
  referenceFor,
  findByReference,
  searchableText,
  matchesQuery,
  searchItems,
  REFERENCE_LENGTH,
  problems,
  transition,
  sort,
  needsPercy
};
