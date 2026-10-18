// src/utils/opsWork.js
//
// WHERE WORK WAITING ON A PERSON ACTUALLY LIVES.
//
// THE POINT, in Percy's words: ops "consolidates whether an actual person is needed to
// do the job". That is the question the desk exists to answer, and until now it could
// not — it knew about six seeded to-dos and nothing else, while five other admin panels
// each held their own queue of things only a human can decide.
//
// The cost of that is not tidiness. It is that "is anything waiting on me?" had five
// answers, so the honest way to find out was to click every tab. A queue nobody can see
// the bottom of gets checked less often, and the things that rot in it are the ones
// nobody was reminded of.
//
// WHAT "NEEDS A PERSON" MEANS HERE
// Not "is unfinished". A studio project in progress is work, and nobody is blocked on
// Percy for it. What belongs on the desk is the subset that is STOPPED UNTIL SOMEONE
// DECIDES: an appeal nobody has ruled on, an inquiry nobody has answered, an application
// nobody has read. That is why each source below names a specific waiting state rather
// than counting its collection.
//
// THE RISK THIS CARRIES, stated because it is the thing that will break
// The waiting state is written here AND in the panel that owns the queue. If a panel
// starts treating `in_review` as handled and this file still counts it, the desk and the
// panel disagree, and the desk is the one people will believe. There is no automatic
// reconciler for that — the values are in component render logic, not in a shared
// constant — so where a source HAS a canonical enum (sponsors do), it is imported rather
// than retyped, and where it does not, the gap is marked below.

import { APPLICATION_STATUS } from '../services/sponsorApplicationService';

/**
 * Every queue that can hold work waiting on a human.
 *
 * `tab` is the Admin Portal tab to send someone to. The desk never tries to resolve
 * these itself: the panel that owns a queue owns the decision, and a second place to
 * approve an appeal is a second place for the two to disagree.
 */
const WORK_SOURCES = [
  {
    key: 'appeals',
    label: 'Appeals',
    collection: 'appeals',
    // The panel filters on exactly this (AppealsReview.js: getFilteredAppeals('pending')).
    waitingWhere: ['status', '==', 'pending'],
    tab: 'appeals',
    why: 'Someone is contesting a takedown and cannot use their account until it is ruled on.'
  },
  {
    key: 'studioInquiries',
    label: 'Studio inquiries',
    collection: 'studioInquiries',
    // StudioInquiriesManager.js counts status === 'new' as the unactioned state.
    waitingWhere: ['status', '==', 'new'],
    tab: 'studio-inquiries',
    why: 'A prospective client asked about studio work and has had no reply.'
  },
  {
    key: 'sponsorApplications',
    label: 'Radio sponsors',
    collection: 'sponsorApplications',
    // IMPORTED, not retyped. sponsorApplicationService.js is the canonical enum and
    // firestore.rules enforces that an applicant may only write SUBMITTED.
    waitingWhere: ['status', '==', APPLICATION_STATUS.SUBMITTED],
    tab: 'sponsor-applications',
    why: 'A sponsor applied and nobody has looked at it. Revenue waiting on a decision.'
  },
  {
    key: 'applications',
    label: 'Job applications',
    collection: 'applications',
    // NO STATUS FIELD EXISTS on this collection, so every row counts as unread. That is
    // not a modelling opinion, it is what the data supports: AdminApplications.js lists
    // them and offers no way to mark one handled, so nothing could ever set a status.
    //
    // The consequence is honest but blunt — this count never falls. It is left this way
    // rather than hidden, because a visible "6 unread, and the panel has no way to clear
    // them" is the finding. Fixing it means giving that panel a reviewed state.
    waitingWhere: null,
    tab: null,
    route: '/admin/applications',
    why: 'Applications nobody has marked as read. This panel has no reviewed state, so the count cannot fall.',
    needsReviewedState: true
  }
];

/**
 * Studio projects are DELIBERATELY ABSENT.
 *
 * They are work, but they are work in progress rather than work waiting on a decision.
 * Counting them would put a number on the desk that never means "do something", and a
 * badge that is always lit is a badge people stop reading. Recorded here so the absence
 * reads as a decision rather than an oversight.
 */
const EXCLUDED = {
  studioProjects: 'In progress, not awaiting a decision. A count that never means "act" trains people to ignore the badge.'
};

/** Total across every source, for the sidebar badge. */
function totalWaiting(counts) {
  return WORK_SOURCES.reduce((n, s) => n + (counts[s.key]?.count || 0), 0);
}

/** Only the sources with something waiting, most first. */
function waitingSources(counts) {
  return WORK_SOURCES
    .map((s) => ({ ...s, count: counts[s.key]?.count || 0, error: counts[s.key]?.error || null }))
    .filter((s) => s.count > 0 || s.error)
    .sort((a, b) => b.count - a.count);
}

export { WORK_SOURCES, EXCLUDED, totalWaiting, waitingSources };
