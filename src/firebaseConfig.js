import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCoXc1YonnH1uW3P4OlAO6eAi911DdyHgs",
  authDomain: "beatflowmedia.firebaseapp.com",
  projectId: "beatflowmedia",
  storageBucket: "beatflowmedia.firebasestorage.app",
  messagingSenderId: "770153949772",
  appId: "1:770153949772:web:0034a30777827ae7dce2e9",
  measurementId: "G-11SMJF5YQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/* App Check: prove the request came from OUR app, not a script.
 *
 * The web apiKey identifies the project and authorises nothing, and
 * firestore.rules grants public read+list on songs and albums. That was free on
 * Spark. On Blaze every document read bills, so an unauthenticated listing of a
 * ~138-document collection at 10 req/s is roughly $69/day from one laptop. App
 * Check is the layer that stops it -- tightening the rules cannot, because the
 * catalogue is genuinely meant to be public.
 *
 * INERT UNTIL CONFIGURED, on purpose. With no site key this block does nothing and
 * the app behaves exactly as before, so this can be merged and deployed before the
 * console work happens rather than needing to land in the same breath.
 *
 * Must run immediately after initializeApp and before getFirestore/getStorage/
 * getFunctions: the SDK attaches App Check tokens to calls made after it is
 * registered, so a later registration silently protects nothing.
 *
 * ENFORCEMENT IS A SEPARATE SWITCH, and it is not ours to flip casually. The
 * station (C:/Users/percy/RadioStation/radio) reads this catalogue over
 * UNAUTHENTICATED REST by design -- "diff and pull work from anywhere with no
 * secret on disk". Enforcement rejects tokenless requests, so turning it on breaks
 * the station's read path. Its service-account push is unaffected. Run App Check in
 * monitoring mode first, read the metrics, move the station to authenticated reads,
 * and only then enforce.
 */
const appCheckSiteKey = process.env.REACT_APP_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  // A debug token lets localhost and CI obtain a valid token without a real
  // reCAPTCHA assessment. Registered in the console under App Check > Apps >
  // Manage debug tokens. Must be set before initializeAppCheck, never in prod.
  const debugToken = process.env.REACT_APP_APPCHECK_DEBUG_TOKEN;
  if (debugToken && process.env.NODE_ENV !== 'production') {
    // Firebase documents this as self.FIREBASE_APPCHECK_DEBUG_TOKEN; window is the
    // same object in a browser document and satisfies no-restricted-globals.
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  /* Which attestation provider.
   *
   * Defaults to Enterprise (Firebase calls it "Fraud Defense") because the console
   * now marks reCAPTCHA Classic as deprecated -- building on it means rebuilding
   * when Google removes it. Enterprise includes 10,000 free assessments a month,
   * and App Check spends roughly one assessment per token lifetime rather than one
   * per request, so at this traffic it is expected to cost nothing.
   *
   * The two are not interchangeable at the console either: Classic wants its SECRET
   * key pasted into Firebase, Enterprise wants only the site key and assesses
   * server-side via the linked Cloud project. Set this to 'v3' only if the app was
   * registered with Classic.
   */
  const useClassic = (process.env.REACT_APP_APPCHECK_PROVIDER || '').toLowerCase() === 'v3';
  const provider = useClassic
    ? new ReCaptchaV3Provider(appCheckSiteKey)
    : new ReCaptchaEnterpriseProvider(appCheckSiteKey);

  try {
    initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    // Never let attestation failure take down the app. An unprotected request is
    // recoverable; a blank page is not.
    console.warn('[AppCheck] initialization failed, continuing without it:', error.message);
  }
}
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);
const functions = getFunctions(app);

export {
  db,
  auth,
  provider,
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  signInWithPopup,
  storage,
  functions,
};


