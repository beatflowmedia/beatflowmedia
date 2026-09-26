import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { APPLICATION_STATUS, startTimelineById, startTimelineLabel } from './sponsorApplicationService';
import { SPONSOR_TIERS } from '../data/sponsorshipTiers';
import { programNameFor } from '../data/radioStation';

/**
 * Everything that is a LEAD, in one shape.
 *
 * Inbound interest arrives in two collections with different fields: general and sync
 * enquiries land in `studioInquiries`, sponsorship applications in
 * `sponsorApplications`. They were shown on two separate admin tabs, which means the
 * question "who should I call back first?" could not be answered without reading both
 * and holding the comparison in your head.
 *
 * This normalises both into one row shape and classifies urgency ONCE, so the admin
 * screen and the notification email cannot disagree about which leads are hot. A
 * classifier in the UI and another in the email is the same bug as a validator in the
 * wizard and another at submit.
 *
 * It does not replace the two existing tabs -- those are working screens for their own
 * workflows. This is the triage view across both.
 */

export const LEAD_URGENCY = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold'
};

export const URGENCY_ORDER = [LEAD_URGENCY.HOT, LEAD_URGENCY.WARM, LEAD_URGENCY.COLD];

export const URGENCY_LABEL = {
  [LEAD_URGENCY.HOT]: 'Hot',
  [LEAD_URGENCY.WARM]: 'Warm',
  [LEAD_URGENCY.COLD]: 'Cold'
};

/**
 * Classify a normalised lead.
 *
 * The rules are deliberately few and readable, because this decides what Percy looks
 * at first and a scoring formula nobody can explain is worse than a short list anyone
 * can argue with.
 *
 *   HOT   money is close: a sponsor who wants to start soon, or a sync enquiry.
 *         Sync is the highest-value thing the platform sells and was, until recently,
 *         being written to a collection nothing read.
 *   COLD  the lead told us they are not buying yet. "Just exploring" is the sponsor
 *         saying so in their own words, and chasing them contradicts what we promised
 *         on the form.
 *   WARM  everything else.
 *
 * Anything already dealt with drops to COLD regardless: an answered lead is not
 * urgent, and leaving it hot buries the ones that are.
 */
export function classifyLead(lead) {
  if (lead.handled) return LEAD_URGENCY.COLD;

  if (lead.kind === 'sponsorship') {
    const timeline = startTimelineById(lead.startTimeline);
    if (lead.startTimeline === 'exploring') return LEAD_URGENCY.COLD;
    if (timeline && timeline.urgent) return LEAD_URGENCY.HOT;
    return LEAD_URGENCY.WARM;
  }

  if (lead.source === 'sync') return LEAD_URGENCY.HOT;
  return LEAD_URGENCY.WARM;
}

/** Statuses that mean somebody has already picked this up. */
const HANDLED_INQUIRY_STATUSES = ['contacted', 'quoted', 'closed'];
const HANDLED_APPLICATION_STATUSES = [
  APPLICATION_STATUS.APPROVED,
  APPLICATION_STATUS.DECLINED,
  APPLICATION_STATUS.ACTIVE
];

/** Firestore Timestamp | string | undefined -> Date | null, without throwing. */
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fromInquiry(id, data) {
  const lead = {
    id: 'inq:' + id,
    kind: 'enquiry',
    source: data.source || 'contact',
    name: data.name || '',
    email: data.email || '',
    company: data.businessName || '',
    phone: '',
    topic: data.serviceInterest || 'Enquiry',
    detail: data.projectDetails || '',
    status: data.status || 'new',
    handled: HANDLED_INQUIRY_STATUSES.includes(data.status),
    createdAt: toDate(data.createdAt),
    startTimeline: '',
    extras: []
  };
  lead.urgency = classifyLead(lead);
  return lead;
}

function fromApplication(id, data) {
  const tier = SPONSOR_TIERS.find((t) => t.id === data.tierId);
  const lead = {
    id: 'app:' + id,
    kind: 'sponsorship',
    source: 'sponsor',
    name: data.contactName || '',
    email: data.email || '',
    company: data.company || '',
    phone: '',
    topic: tier ? tier.name + ' sponsorship' : 'Sponsorship',
    detail: data.describe || '',
    status: data.status || APPLICATION_STATUS.SUBMITTED,
    handled: HANDLED_APPLICATION_STATUSES.includes(data.status),
    createdAt: toDate(data.createdAt),
    startTimeline: data.startTimeline || '',
    extras: [
      ['Start', startTimelineLabel(data.startTimeline) + (data.preferredStart ? ` (${data.preferredStart})` : '')],
      ['Programme', programNameFor(data.programId)],
      ['Link', data.landingUrl || ''],
      ['Spot', data.audio ? 'supplied' : data.wantsProduction ? 'we produce it' : 'none']
    ]
  };
  lead.urgency = classifyLead(lead);
  return lead;
}

/**
 * Read both collections and return one sorted list.
 *
 * Sorted by urgency first and recency second, which is the order the screen exists to
 * impose. Sorting purely by date is what the two separate tabs already did.
 */
export async function fetchLeads() {
  const [inquiries, applications] = await Promise.all([
    getDocs(query(collection(db, 'studioInquiries'), orderBy('createdAt', 'desc'))).catch((err) => {
      console.warn('Could not read studioInquiries:', err);
      return { docs: [] };
    }),
    getDocs(query(collection(db, 'sponsorApplications'), orderBy('createdAt', 'desc'))).catch((err) => {
      console.warn('Could not read sponsorApplications:', err);
      return { docs: [] };
    })
  ]);

  const leads = [
    ...inquiries.docs.map((d) => fromInquiry(d.id, d.data())),
    ...applications.docs.map((d) => fromApplication(d.id, d.data()))
  ];

  return leads.sort((a, b) => {
    const byUrgency = URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency);
    if (byUrgency !== 0) return byUrgency;
    return (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0);
  });
}
