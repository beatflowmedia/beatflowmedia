// src/services/landingPageStore.js
//
// Reading and writing landing pages. The only module that touches `landingPages`.
//
// WHY THIS COLLECTION AND NOT ANOTHER
// The admin manager used to hold a `mockPages` array with a comment saying production
// would "fetch from Firestore marketing_content collection". That collection name
// appears nowhere else. `src/pages/MarketingLanding.js` -- the page a visitor actually
// gets at /marketing/landing/<slug> -- reads `landingPages`. What is SERVED is the
// canonical origin, so this writes where the public page reads. An admin screen managing
// a different collection from the one the site renders is a second source of truth whose
// drift nobody would notice, because both halves look fine on their own.
//
// THE DOCUMENT SHAPE IS SET BY THE PUBLIC PAGE, not by this screen. MarketingLanding
// renders `hero` (title, subtitle, image), `sections[]`, `cta` (title, description,
// buttonUrl) and honours `redirect`. Anything this writes outside that shape is stored
// and never rendered, which is the quietest way to lose work.

import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION = 'landingPages';

/**
 * Every landing page, newest first.
 *
 * NO METRICS ARE RETURNED, and that absence is the honest part. The screen this feeds
 * used to show 1,247 views and 89 conversions; both were literals typed into the source.
 * Nothing tracks a landing page view -- MarketingLanding.js records no event of any kind
 * -- so there is no number to read. Returning 0 would be worse than returning nothing,
 * because 0 means "measured, and nobody came" while the truth is "never measured".
 */
export async function loadLandingPages() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => ({ slug: d.id, ...d.data() }))
    .sort((a, b) => String(b.updatedAt?.seconds || 0) - String(a.updatedAt?.seconds || 0));
}

/** One page, or null. The slug IS the document id, matching how the public page reads. */
export async function loadLandingPage(slug) {
  const snap = await getDoc(doc(db, COLLECTION, slug));
  return snap.exists() ? { slug: snap.id, ...snap.data() } : null;
}

/**
 * Create or update a page.
 *
 * `status` is the only thing that decides whether the public route serves it, so it is
 * validated here rather than trusted from a form: a typo of 'publshed' would leave a
 * page that looks live on this screen and is invisible to the site.
 */
export async function saveLandingPage(slug, data) {
  const clean = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!clean) throw new Error('A landing page needs a slug — it becomes the URL.');

  const status = data.status === 'published' ? 'published' : 'draft';

  await setDoc(doc(db, COLLECTION, clean), {
    ...data,
    slug: clean,
    status,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return clean;
}

/** Remove a page. The public route then 404s, which is the intended effect of deleting
 *  a marketing page -- but see the SEO note in CLAUDE.md: a removed URL that was ever
 *  indexed should 301 to its closest live equivalent rather than simply disappear. */
export async function deleteLandingPage(slug) {
  await deleteDoc(doc(db, COLLECTION, slug));
}
