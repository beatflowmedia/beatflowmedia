/**
 * Ad consent — the canonical origin for whether this visitor gets personalised ads.
 *
 * WHY THIS EXISTS
 * ---------------
 * /ad-preferences offered nine toggles, saved them to the user's Firestore document,
 * and NOTHING read the field back. A visitor who switched "Personalized Ads" off saw
 * a success message and kept receiving personalised ads. Unlike the other
 * write-with-no-reader bugs in this codebase, this one is a privacy representation:
 * the site told a person their choice had been recorded and acted on, and only the
 * first half was true.
 *
 * It could not have worked as designed, either. Google's flag is STATELESS -- it has
 * to be set on EVERY page load, before any ad request fires:
 *
 *   (adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1
 *
 * "If the parameter is not set in subsequent requests for that user, the behavior
 * will revert to the default behavior, which is to request personalized ads."
 * -- https://support.google.com/adsense/answer/7670312
 *
 * A preference living only in Firestore arrives asynchronously, after login, long
 * after the ad tag in index.html has already requested ads. So the choice must be
 * readable SYNCHRONOUSLY at boot, which means local storage.
 *
 * SINGLE SOURCE
 * -------------
 * Firestore stays the origin of record -- it is per-account and survives a cleared
 * browser. localStorage is the optimistic local copy that makes the value available
 * in time, and it RECONCILES: reconcileFromProfile() pulls the stored preference
 * forward whenever we learn it. That is the S caveat working as intended rather than
 * a second source of truth.
 *
 * FAIL CLOSED
 * -----------
 * index.html pauses ad requests before the tag can fire. Only this module resumes
 * them, after applying the visitor's choice. If the bundle never loads, ads never
 * request -- we lose the impression rather than serve a personalised ad to someone
 * who declined one. That is the correct way round for a privacy control to break.
 */

// Versioned: if the meaning of the stored value ever changes, change the key rather
// than reinterpreting old values, which would silently re-consent people.
export const AD_CONSENT_KEY = 'bfmg.ads.personalized.v1';

// Google's own default is personalised, and the UI has always been phrased as an
// OPT-OUT ("You can opt out of personalized advertising"). Defaulting to false here
// would be a stricter posture, but it would also misreport the visitor's choice --
// they have not declined, they simply have not been asked.
//
// NOT A COMPLIANCE JUDGEMENT. GDPR requires opt-IN consent before personalised ads
// for EU visitors, which an opt-out default does not satisfy. Serving EU traffic
// properly needs a consent management platform, not this constant. Flagged for a
// lawyer; see the ledger in CLAUDE.md.
const DEFAULT_ALLOWED = true;

/**
 * Read the visitor's choice. Synchronous by necessity -- see the header.
 * Never throws: storage can be unavailable in private windows or with site data
 * blocked, and an ad preference is not worth breaking a page load over.
 */
export function isPersonalizedAdsAllowed() {
  try {
    const raw = window.localStorage.getItem(AD_CONSENT_KEY);
    if (raw === null) return DEFAULT_ALLOWED;
    return raw === 'true';
  } catch {
    return DEFAULT_ALLOWED;
  }
}

/**
 * Record the choice locally so the NEXT page load can honour it synchronously.
 * Callers persist to Firestore separately; this is the fast local copy.
 */
export function setPersonalizedAdsAllowed(allowed) {
  try {
    window.localStorage.setItem(AD_CONSENT_KEY, allowed ? 'true' : 'false');
  } catch {
    // Storage unavailable. The Firestore write still happened, so the choice is not
    // lost -- it just will not be honoured until storage works again. Better than
    // throwing inside a settings save.
  }
}

/**
 * Pull the stored preference forward from the account record once it loads.
 * Call this when a user's profile becomes available.
 */
export function reconcileFromProfile(adPreferences) {
  if (!adPreferences || typeof adPreferences.personalizedAds !== 'boolean') return;
  setPersonalizedAdsAllowed(adPreferences.personalizedAds);
}

/**
 * Apply the choice to the ad tag and release the paused queue.
 *
 * index.html sets pauseAdRequests = 1 before loading adsbygoogle.js, so no request
 * leaves the page until this runs. Google requires resuming explicitly: "If you
 * don't set pauseAdRequests=0, no ads will appear."
 */
export function applyAdConsent() {
  try {
    const queue = (window.adsbygoogle = window.adsbygoogle || []);
    if (!isPersonalizedAdsAllowed()) {
      queue.requestNonPersonalizedAds = 1;
    }
    queue.pauseAdRequests = 0;
  } catch (err) {
    // Deliberately swallowed. A failure here costs ad revenue; a throw here would
    // cost the page. Ads are never the reason the app fails to start.
    console.warn('[adConsent] could not apply ad consent:', err);
  }
}
