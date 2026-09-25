import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import FileDropzone from "../components/FileDropzone";
import { useAuth } from "../context/AuthContext";
import { SPONSOR_TIERS, formatMonthly } from "../data/sponsorshipTiers";
import { PROGRAM_CHOICES, NO_PREFERENCE, SPOT_BLOCKS } from "../data/radioPrograms";
import {
  submitApplication,
  validateApplication,
  latestApplicationFor,
  APPLICATION_STATUS,
  canPay
} from "../services/sponsorApplicationService";

// The sponsor onboarding flow, ordered the way a self-serve ad platform actually
// orders one. Roku Ads Manager states its process as four steps:
//
//   1. "Create your account."
//   2. "Choose your objective and target audience."
//   3. "Upload your creative for approval."
//   4. "Launch your campaign and measure results."
//
// Payment is not among them -- it attaches at launch, after creative approval. The
// first version of /advertising opened Stripe Checkout straight from a package card,
// which took money before knowing the brand, the landing URL or the audio, and before
// anyone had judged whether the ad should air at all. That produced a live monthly
// subscription with nothing to broadcast.
//
// "Target audience" has no equivalent here and is deliberately NOT invented: the
// station cannot target, and cannot measure who listens. The second step is the
// package and what is being advertised, which is the honest local analogue.

const STEPS = [
  { n: 1, title: "Your account", detail: "So we can attach the sponsorship to you." },
  { n: 2, title: "Choose a package", detail: "What you want to run." },
  { n: 3, title: "Upload your creative", detail: "Your spot and logo, for approval." },
  { n: 4, title: "We approve, then you pay", detail: "Nothing is charged before that." }
];

const EMPTY = {
  tierId: "",
  programId: NO_PREFERENCE.id,
  spotBlock: "30",
  company: "",
  blurb: "",
  cta: "",
  contactName: "",
  email: "",
  landingUrl: "",
  describe: "",
  preferredStart: "",
  wantsProduction: false,
  audioFile: null,
  logoFile: null
};

const STATUS_COPY = {
  [APPLICATION_STATUS.SUBMITTED]: {
    label: "Submitted",
    body: "We have your application and are reviewing it. Nothing has been charged."
  },
  [APPLICATION_STATUS.IN_REVIEW]: {
    label: "In review",
    body: "We are listening to your spot and checking it suits the station. Nothing has been charged."
  },
  [APPLICATION_STATUS.APPROVED]: {
    label: "Approved",
    body: "Your sponsorship is approved. You can start it whenever you are ready — billing begins at that point, not before."
  },
  [APPLICATION_STATUS.DECLINED]: {
    label: "Not approved",
    body: "We were not able to run this one. We will have written to you with the reason, and you were not charged."
  },
  [APPLICATION_STATUS.ACTIVE]: {
    label: "Running",
    body: "Your spot is in rotation. Your monthly airing report covers exactly when it ran."
  }
};

export default function SponsorApply() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ ...EMPTY, tierId: params.get("tier") || "" });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const app = await latestApplicationFor(user);
      if (!cancelled) {
        setExisting(app);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const change = (e) => {
    const { name, type, value, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] || null : value
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const check = validateApplication(form);
    if (!check.isValid) {
      setErrors(check.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setSubmitting(true);
    const result = await submitApplication(user, form);
    setSubmitting(false);
    if (result.success) {
      setDone(result.message);
      setForm(EMPTY);
    } else {
      setErrors([result.message]);
    }
  };

  // The chosen package decides what the creative step asks for. Supporter carries no
  // audio, so offering an audio upload there offers to make something it cannot run.
  const selectedTier = SPONSOR_TIERS.find((t) => t.id === form.tierId) || null;
  const wantsAudio = Boolean(selectedTier && selectedTier.audioSpot);

  const field =
    "w-full min-h-[44px] text-base bg-gray-700 text-white p-3 rounded border " +
    "border-gray-600 focus:border-green-500 focus:outline-none";

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto py-12 sm:py-16">
          <h1 className="text-4xl font-bold mb-3">Apply to sponsor</h1>
          <p className="text-gray-300 mb-10">
            Tell us what you want to run and send us the spot. We review every
            sponsorship before it airs — and you are not charged until it is approved.
          </p>

          {/* The four steps, stated up front so nobody wonders where the pay button is. */}
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {STEPS.map((step) => (
              <li key={step.n} className="bg-gray-800 rounded-lg p-4 flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">
                  {step.n}
                </span>
                <span>
                  <span className="block font-semibold">{step.title}</span>
                  <span className="block text-sm text-gray-400">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* Step 1 gate. Sign-in is not decoration: an application has to attach to an
              account, because an approved application becomes a subscription. */}
          {!user ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">Sign in to apply</h2>
              <p className="text-gray-400 mb-6">
                Sponsorships are attached to an account so you can see where your
                application stands and manage billing later.
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center min-h-[48px] px-8 text-base bg-green-600 hover:bg-green-500 rounded-full font-semibold transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : checking ? (
            <p className="text-gray-400">Checking your applications…</p>
          ) : done ? (
            <div role="status" className="bg-green-900/30 border border-green-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Application received</h2>
              <p className="text-gray-300">{done}</p>
            </div>
          ) : existing ? (
            // Already applied. Showing the form again would invite a duplicate and
            // leave them unsure whether the first one landed.
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-1">
                {(STATUS_COPY[existing.status] || {}).label || existing.status}
              </h2>
              <p className="text-gray-400 mb-4">
                {(STATUS_COPY[existing.status] || {}).body ||
                  "We are looking at your application."}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {existing.company} — {(SPONSOR_TIERS.find((t) => t.id === existing.tierId) || {}).name || existing.tierId}
              </p>

              {canPay(existing) ? (
                <Link
                  to="/advertising"
                  className="inline-flex items-center justify-center min-h-[48px] px-8 text-base bg-green-600 hover:bg-green-500 rounded-full font-semibold transition-colors"
                >
                  Start my sponsorship
                </Link>
              ) : (
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 text-base bg-gray-700 hover:bg-gray-600 rounded-full font-semibold transition-colors"
                >
                  Ask us about it
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              {errors.length > 0 && (
                <div role="alert" className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-200 space-y-1 text-sm">
                    {errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 2 */}
              <fieldset>
                <legend className="text-xl font-bold mb-3">2. Choose a package</legend>
                <div className="space-y-3">
                  {SPONSOR_TIERS.map((tier) => (
                    <label
                      key={tier.id}
                      className={`flex gap-3 items-start p-4 rounded-lg border cursor-pointer min-h-[44px] ${
                        form.tierId === tier.id
                          ? "bg-gray-700 border-green-500"
                          : "bg-gray-800 border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tierId"
                        value={tier.id}
                        checked={form.tierId === tier.id}
                        onChange={change}
                        className="mt-1 w-5 h-5 accent-green-500"
                      />
                      <span>
                        <span className="block font-semibold">
                          {tier.name} — {formatMonthly(tier)}
                        </span>
                        <span className="block text-sm text-gray-400">{tier.summary}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Programme, not time slot.
                *
                * The station has eight named programmes with genuinely different
                * music, lengths and ad loads, so choosing one is choosing a
                * materially different thing. A TIME is not offered, because no
                * programme's loop divides evenly into 24 hours -- every airing is
                * exactly computable but lands somewhere different each day, so there
                * is no recurring slot to sell.
                *
                * No live "slots remaining" either: that number lives in the station's
                * playlist.json in another repository, and a stale scarcity claim on a
                * sales page is false the moment it drifts. Availability is confirmed
                * during approval, against the live station. */}
              <fieldset>
                <legend className="text-xl font-bold mb-3">Where it should run</legend>
                <div>
                  <label htmlFor="programId" className="block text-sm font-semibold mb-2">
                    Programme
                  </label>
                  <select id="programId" name="programId" value={form.programId} onChange={change} className={field}>
                    {PROGRAM_CHOICES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.id === NO_PREFERENCE.id ? "" : ` (${p.hours})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-400 mt-2">
                    {(PROGRAM_CHOICES.find((p) => p.id === form.programId) || {}).blurb}
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    We cap how much advertising each programme carries, so the busier
                    ones fill up. We will confirm space in your chosen programme when we
                    review your application, and tell you before you are charged if it
                    is full.
                  </p>
                </div>
              </fieldset>

              {/* Who */}
              <fieldset className="space-y-4">
                <legend className="text-xl font-bold mb-1">Who is advertising</legend>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold mb-2">
                    Advertiser or brand name <span className="text-green-500">*</span>
                  </label>
                  <input id="company" name="company" type="text" value={form.company} onChange={change} className={field} />
                </div>

                <div>
                  <label htmlFor="contactName" className="block text-sm font-semibold mb-2">
                    Contact name <span className="text-green-500">*</span>
                  </label>
                  <input id="contactName" name="contactName" type="text" autoComplete="name" value={form.contactName} onChange={change} className={field} />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">
                    Email <span className="text-green-500">*</span>
                  </label>
                  <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={field} />
                </div>

                <div>
                  <label htmlFor="landingUrl" className="block text-sm font-semibold mb-2">
                    Where the sponsor card should link <span className="text-green-500">*</span>
                  </label>
                  <input id="landingUrl" name="landingUrl" type="url" placeholder="https://" value={form.landingUrl} onChange={change} className={field} />
                </div>

                {/* blurb and cta are collected from the SPONSOR, not written by us.
                  *
                  * The station's sponsor card requires both, and they are the two
                  * fields most likely to be invented if the form does not ask. Radio
                  * reports that invented card content is exactly how a card once named
                  * one advertiser while another's audio played -- the advertiser is the
                  * only party who can say how they want to be described and what the
                  * button should say. */}
                <div>
                  <label htmlFor="blurb" className="block text-sm font-semibold mb-2">
                    One line for your sponsor card <span className="text-green-500">*</span>
                  </label>
                  <input
                    id="blurb"
                    name="blurb"
                    type="text"
                    maxLength={140}
                    value={form.blurb}
                    onChange={change}
                    className={field}
                    placeholder="Handmade ceramics from a studio in Asbury Park."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This appears on screen while your spot plays. One sentence.
                  </p>
                </div>

                <div>
                  <label htmlFor="cta" className="block text-sm font-semibold mb-2">
                    Button label <span className="text-green-500">*</span>
                  </label>
                  <input
                    id="cta"
                    name="cta"
                    type="text"
                    maxLength={40}
                    value={form.cta}
                    onChange={change}
                    className={field}
                    placeholder="Shop the collection"
                  />
                </div>

                <div>
                  <label htmlFor="describe" className="block text-sm font-semibold mb-2">
                    What are you advertising? <span className="text-green-500">*</span>
                  </label>
                  <textarea
                    id="describe"
                    name="describe"
                    rows={4}
                    value={form.describe}
                    onChange={change}
                    className={field}
                    placeholder="What the product or service is, and anything we should know before it airs."
                  />
                </div>

                <div>
                  <label htmlFor="preferredStart" className="block text-sm font-semibold mb-2">
                    Preferred start <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input id="preferredStart" name="preferredStart" type="date" value={form.preferredStart} onChange={change} className={field} />
                </div>
              </fieldset>

              {/* Step 3 */}
              <fieldset className="space-y-4">
                <legend className="text-xl font-bold mb-1">3. Upload your creative</legend>
                <p className="text-sm text-gray-400">
                  We review everything before it airs. Audio up to 50MB, logo up to 40MB.
                </p>

                {!wantsAudio && selectedTier && (
                  <p className="text-sm text-gray-400 bg-gray-900/50 rounded p-3">
                    {selectedTier.name} is a sponsor-card package — it carries no audio
                    spot, so there is nothing to upload but your logo. Choose Rotation or
                    Featured if you want a spot on air.
                  </p>
                )}

                {wantsAudio && (
                  <>
                {/* WAV is asked for FIRST, which looks backwards for a web upload and
                  * is not. The station transcodes everything it receives to MP3 and
                  * normalises it. An MP3 arriving here gets encoded twice -- once by
                  * the sponsor, once by us -- and generation loss is not recoverable.
                  * A WAV is encoded once. Same reason we take the format list straight
                  * from the station's own accepted set rather than a shorter one. */}
                <FileDropzone
                  label="Your audio spot"
                  hint="WAV is best — we convert it ourselves, so an uncompressed file keeps the quality. MP3, M4A, FLAC, AIFF, AAC and OGG are fine too. Do not normalise or master it for us; we level every spot to the same loudness automatically."
                  accept={{
                    "audio/wav": [".wav"],
                    "audio/x-wav": [".wav"],
                    "audio/aiff": [".aiff", ".aif"],
                    "audio/flac": [".flac"],
                    "audio/mpeg": [".mp3"],
                    "audio/mp4": [".m4a"],
                    "audio/aac": [".aac"],
                    "audio/ogg": [".ogg"]
                  }}
                  file={form.audioFile}
                  maxBytes={50 * 1024 * 1024}
                  onFile={(f) => setForm((prev) => ({ ...prev, audioFile: f }))}
                />

                {/* Target BLOCK, never a duration.
                  *
                  * We cannot know the duration: it is measured on the station's side
                  * after transcoding, and a declared value that disagrees with the
                  * file by more than 0.25s fails their build. Worse, cue() sums
                  * declared durations, so a wrong one shifts every record after it for
                  * every listener, permanently, with no self-correction.
                  *
                  * Intent is the part we CAN capture, and it matters: a spot that fits
                  * no block is unsellable, and most of the station's existing spots
                  * fit none -- a fault nobody caught until there was a checker. */}
                <div>
                  <label htmlFor="spotBlock" className="block text-sm font-semibold mb-2">
                    How long is your spot?
                  </label>
                  <select id="spotBlock" name="spotBlock" value={form.spotBlock} onChange={change} className={field}>
                    {SPOT_BLOCKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-400 mt-2">
                    As a script, that is{" "}
                    {(SPOT_BLOCKS.find((b) => b.id === form.spotBlock) || {}).words}. We
                    measure the finished file and will tell you if it needs trimming.
                  </p>
                </div>

                {/* Only offered where a spot can actually run.
                  *
                  * Supporter is a sponsor-card package and carries NO audio at all
                  * (audioSpot: false). Showing an upload and an offer to produce a spot
                  * for that tier offered to make something the package cannot air --
                  * the sponsor would supply it, we would take the money, and it would
                  * sit unused.
                  *
                  * Production is INCLUDED in both tiers that carry audio, so there is
                  * no upcharge to state. If that ever changes, the price belongs in
                  * sponsorshipTiers.js with the rest of the money, not in this label. */}
                <label className="flex gap-3 items-start p-4 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    name="wantsProduction"
                    checked={form.wantsProduction}
                    onChange={change}
                    className="mt-1 w-5 h-5 accent-green-500"
                  />
                  <span>
                    <span className="block font-semibold">
                      Produce the spot for me — no extra charge
                    </span>
                    <span className="block text-sm text-gray-400">
                      Included with {selectedTier ? selectedTier.name : "this package"}.
                      We write and record it from what you have told us above, and send
                      it for your approval. Nothing airs until you have approved it.
                    </span>
                  </span>
                </label>
                  </>
                )}

                {/* Guidance corrected against how the station actually processes art.
                  *
                  * This said "a transparent PNG looks best", which is wrong: the
                  * station re-encodes every logo to JPEG, so an alpha channel is
                  * flattened. Telling a sponsor to supply transparency produces a mark
                  * with a black or white box behind it on air.
                  *
                  * SVG is not accepted either -- the pipeline takes raster formats
                  * only. And the slot is SQUARE, so a wide wordmark arrives in a box
                  * that is mostly empty. Largest original, unresized: the station
                  * resizes to fit 800x800 itself, and a pre-shrunk file only loses
                  * detail it cannot get back. */}
                <FileDropzone
                  label="Your logo"
                  hint="JPG, PNG, WEBP, GIF or AVIF. Send the largest version you have — we resize it. A square mark works best, because the space it goes in is square. Note it is displayed as a JPEG, so transparency is flattened."
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                    "image/gif": [".gif"],
                    "image/avif": [".avif"]
                  }}
                  file={form.logoFile}
                  maxBytes={40 * 1024 * 1024}
                  onFile={(f) => setForm((prev) => ({ ...prev, logoFile: f }))}
                />
              </fieldset>

              {/* Step 4 */}
              <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-5">
                <h2 className="font-bold mb-2">4. We approve, then you pay</h2>
                <p className="text-sm text-gray-400">
                  Submitting this does not charge you. We review the spot, confirm it
                  suits the station, and come back within two business days. If we
                  approve it you choose when to start, and billing begins then. If we
                  decline it, you pay nothing and we tell you why.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] text-base rounded-full font-semibold bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By applying you agree to our{" "}
                <Link to="/terms" className="text-gray-400 hover:underline">
                  Terms
                </Link>
                . We decline advertising we judge unsuitable for the station.
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
