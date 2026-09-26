import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import FileDropzone from "../components/FileDropzone";
import { useAuth } from "../context/AuthContext";
import { SPONSOR_TIERS, formatMonthly } from "../data/sponsorshipTiers";
import {
  PROGRAM_CHOICES,
  NO_PREFERENCE,
  SPOT_BLOCKS,
  CTA_OPTIONS,
  AUDIO_SPEC,
  LOGO_SPEC,
  megabytesOf,
  LOGO_GUIDANCE,
  DEFAULT_SPOT_BLOCK,
  programNameFor
} from "../data/radioStation";
import {
  submitApplication,
  validateApplication,
  latestApplicationFor,
  APPLICATION_STATUS,
  canPay,
  normalizeLandingUrl,
  START_TIMELINES,
  DEFAULT_START_TIMELINE,
  timelineNeedsDate,
  startTimelineLabel,
  startTimelineNote,
  hasTightProductionTimeline
} from "../services/sponsorApplicationService";

/**
 * Sponsor onboarding, as a wizard.
 *
 * WHY A WIZARD AND NOT THE LONG FORM IT REPLACES
 * ----------------------------------------------
 * The page already advertised four steps at the top and then delivered one very long
 * scroll -- it promised a wizard and gave a form. Three things made the form the
 * wrong shape, and none of them is aesthetic:
 *
 *   - It is CONDITIONAL. Choosing Supporter removes the entire audio section, and a
 *     section vanishing from the middle of a long page reads as "did I break
 *     something?". In a wizard the step simply is not there.
 *   - It is phone-hostile. One scroll of a package picker, eight fields and two
 *     uploads is a long way down on a handset, which is the default target here.
 *   - It failed late. A single submit meant a 50MB upload could fail AFTER everything
 *     was filled in, and the sponsor would have to work out what to redo.
 *
 * ORDER FROM ROKU ADS MANAGER, which Percy gave as the reference: "Create your
 * account." / "Choose your objective and target audience." / "Upload your creative
 * for approval." / "Launch your campaign and measure results." Payment is not one of
 * the four -- it attaches after approval, which is what step 4 here says.
 *
 * ONE FORM UNDERNEATH
 * -------------------
 * There is a single `form` object and a single submit. Steps are a VIEW over it, and
 * each step names the fields it owns so validateApplication can check exactly those
 * with the same rules the final submit uses. Building four little forms would give
 * four chances for the wizard and the submit handler to disagree about what a valid
 * application is.
 *
 * PROGRESS SURVIVES A REFRESH
 * ---------------------------
 * A four-step wizard that loses everything on reload is worse than the long form it
 * replaced, so the text fields are saved as they are typed. Files are NOT saved --
 * a File cannot be serialised -- so the creative step says so plainly rather than
 * letting someone believe an attachment came back.
 */

const DRAFT_KEY = "bfmg.sponsor.draft.v1";

const EMPTY = {
  tierId: "",
  programId: NO_PREFERENCE.id,
  company: "",
  blurb: "",
  cta: "",
  contactName: "",
  email: "",
  landingUrl: "",
  describe: "",
  startTimeline: DEFAULT_START_TIMELINE,
  preferredStart: "",
  spotBlock: DEFAULT_SPOT_BLOCK,
  wantsProduction: false,
  audioFile: null,
  logoFile: null
};

// Files are deliberately absent from the draft: a File object cannot be serialised,
// and a draft that silently drops them would restore a form that LOOKS complete and
// is not.
const DRAFT_FIELDS = Object.keys(EMPTY).filter(
  (k) => k !== "audioFile" && k !== "logoFile"
);

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

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private windows and blocked site data both throw. A lost draft is a nuisance;
    // a page that will not load because of one is a defect.
    return null;
  }
}

function saveDraft(form) {
  try {
    const slim = {};
    DRAFT_FIELDS.forEach((k) => {
      slim[k] = form[k];
    });
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(slim));
  } catch {
    /* see loadDraft */
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* see loadDraft */
  }
}

export default function SponsorApply() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(loadDraft() || {}),
    // A tier in the URL is an explicit choice made on /advertising just now, so it
    // beats whatever a stale draft remembers.
    ...(params.get("tier") ? { tierId: params.get("tier") } : {})
  }));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    saveDraft(form);
  }, [form]);

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

  const selectedTier = SPONSOR_TIERS.find((t) => t.id === form.tierId) || null;
  const wantsAudio = Boolean(selectedTier && selectedTier.audioSpot);

  // Which fields each step owns. Naming them here rather than writing per-step
  // checks is what keeps one definition of "valid" for the wizard and the submit.
  const STEPS = [
    { n: 1, title: "Your account", fields: [] },
    { n: 2, title: "Package", fields: ["tierId"] },
    {
      n: 3,
      title: "Your details",
      fields: [
        "company", "contactName", "email", "landingUrl",
        "blurb", "cta", "describe", "startTimeline"
      ]
    },
    { n: 4, title: "Your creative", fields: ["audioFile", "logoFile"] }
  ];

  const change = useCallback((e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const setFile = (key) => (file) => setForm((prev) => ({ ...prev, [key]: file }));

  const next = () => {
    const current = STEPS.find((s) => s.n === step);
    const check = validateApplication(form, current.fields);
    if (!check.isValid) {
      setErrors(check.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    // Whole-application check, not just the last step. A field edited on step 3 and
    // then invalidated by a later choice would otherwise slip through.
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
      clearDraft();
      setForm(EMPTY);
    } else {
      setErrors([result.message]);
    }
  };

  const field =
    "w-full min-h-[44px] text-base bg-gray-700 text-white p-3 rounded border " +
    "border-gray-600 focus:border-green-500 focus:outline-none";

  const navButtons = (isLast) => (
    <div className="flex gap-3 pt-2">
      {step > 1 && (
        <button
          type="button"
          onClick={back}
          className="min-h-[48px] px-6 text-base rounded-full font-semibold bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
      )}
      {isLast ? (
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 min-h-[48px] text-base rounded-full font-semibold bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      ) : (
        <button
          type="button"
          onClick={next}
          className="flex-1 min-h-[48px] text-base rounded-full font-semibold bg-green-600 hover:bg-green-500 transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Apply to sponsor</h1>
          <p className="text-gray-300 mb-8">
            We review every sponsorship before it airs. Nothing is charged until it is
            approved.
          </p>

          {/* Progress. A wizard without a visible position is just a form with the
              rest of it hidden. */}
          <ol className="flex gap-2 mb-10" aria-label="Progress">
            {STEPS.map((s) => (
              <li key={s.n} className="flex-1">
                <div
                  className={`h-1.5 rounded-full mb-2 ${
                    s.n < step ? "bg-green-600" : s.n === step ? "bg-green-500" : "bg-gray-700"
                  }`}
                />
                <span
                  className={`text-xs ${s.n === step ? "text-white font-semibold" : "text-gray-500"}`}
                >
                  {s.title}
                </span>
              </li>
            ))}
          </ol>

          {done ? (
            <div role="status" className="bg-green-900/30 border border-green-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Application received</h2>
              <p className="text-gray-300">{done}</p>
            </div>
          ) : checking ? (
            <p className="text-gray-400">Checking your applications…</p>
          ) : existing ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-1">
                {(STATUS_COPY[existing.status] || {}).label || existing.status}
              </h2>
              <p className="text-gray-400 mb-4">
                {(STATUS_COPY[existing.status] || {}).body || "We are looking at your application."}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {existing.company} —{" "}
                {(SPONSOR_TIERS.find((t) => t.id === existing.tierId) || {}).name || existing.tierId}
              </p>
              <Link
                to={canPay(existing) ? "/advertising" : "/contact"}
                className="inline-flex items-center justify-center min-h-[48px] px-8 text-base bg-green-600 hover:bg-green-500 rounded-full font-semibold transition-colors"
              >
                {canPay(existing) ? "Start my sponsorship" : "Ask us about it"}
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-6">
              {errors.length > 0 && (
                <div role="alert" className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-200 space-y-1 text-sm">
                    {errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 1 — account */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold">Your account</h2>
                  {user ? (
                    <>
                      <p className="text-gray-300">
                        Signed in as <strong>{user.email}</strong>. Your sponsorship will
                        be attached to this account, which is where you will manage
                        billing later.
                      </p>
                      {navButtons(false)}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-300">
                        Sponsorships attach to an account so you can track your
                        application and manage billing. Please sign in to continue.
                      </p>
                      <Link
                        to="/"
                        className="inline-flex items-center justify-center min-h-[48px] px-8 text-base bg-green-600 hover:bg-green-500 rounded-full font-semibold transition-colors"
                      >
                        Sign in
                      </Link>
                      <p className="text-sm text-gray-500">
                        Anything you have already typed is saved on this device.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* 2 — package and placement */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold">Choose a package</h2>

                  <div className="space-y-3">
                    {SPONSOR_TIERS.map((tier) => (
                      <label
                        key={tier.id}
                        className={`flex gap-3 items-start p-4 rounded-lg border cursor-pointer ${
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

                  <div>
                    <label htmlFor="programId" className="block text-sm font-semibold mb-2">
                      Which programme?
                    </label>
                    <select
                      id="programId"
                      name="programId"
                      value={form.programId}
                      onChange={change}
                      className={field}
                    >
                      {/* The option shows the programme's REAL airtime, not its
                          nominal span. Narrower programmes take slots out of wider
                          ones, so Afternoon Flow's "15:00-19:00" is actually 2h26m --
                          a 39% overstatement, and the one a sponsor is most likely to
                          notice, because "the afternoon" sounds like it includes drive
                          time. The exclusions appear underneath rather than in the
                          option label, which would be unreadable in a select. */}
                      {PROGRAM_CHOICES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.actualHours ? ` — ${p.actualHours} a day` : ""}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const chosen = PROGRAM_CHOICES.find((p) => p.id === form.programId) || {};
                      return (
                        <>
                          <p className="text-sm text-gray-400 mt-2">{chosen.blurb}</p>
                          {chosen.hours && (
                            <p className="text-sm text-gray-500 mt-1">{chosen.hours}</p>
                          )}
                        </>
                      );
                    })()}
                    <p className="text-sm text-gray-500 mt-3">
                      We cap how much advertising each programme carries, so the busier
                      ones fill up. We confirm space when we review your application, and
                      tell you before you are charged if it is full.
                    </p>
                  </div>

                  {navButtons(false)}
                </div>
              )}

              {/* 3 — the advertiser */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold">Who is advertising</h2>

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
                    {/* type="text", not type="url".
                      *
                      * A url input applies the browser's own validation, which rejects
                      * "example.com" before our normaliser ever runs -- the browser
                      * would fight the very convenience we are adding.
                      *
                      * Normalised on BLUR rather than on every keystroke: prepending
                      * while someone is still typing moves the caret and is infuriating.
                      * On blur they see exactly what will be stored, which is the same
                      * function the service uses. */}
                    <input
                      id="landingUrl"
                      name="landingUrl"
                      type="text"
                      inputMode="url"
                      placeholder="example.com"
                      value={form.landingUrl}
                      onChange={change}
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          landingUrl: normalizeLandingUrl(prev.landingUrl)
                        }))
                      }
                      className={field}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      No need to type https:// — we add it.
                    </p>
                  </div>

                  {/* blurb and cta come from the SPONSOR, never written by us. The
                      station's card requires both, and they are the two fields most
                      likely to be invented if the form does not ask -- invented card
                      content is how a card once named one advertiser while another's
                      audio played. */}
                  <div>
                    <label htmlFor="blurb" className="block text-sm font-semibold mb-2">
                      One line for your sponsor card <span className="text-green-500">*</span>
                    </label>
                    <input id="blurb" name="blurb" type="text" maxLength={140} value={form.blurb} onChange={change} className={field} placeholder="Handmade ceramics from a studio in Asbury Park." />
                    <p className="text-sm text-gray-500 mt-2">Shown on screen while your spot plays.</p>
                  </div>

                  {/* Fixed list, not free text. A sponsor could otherwise write a
                      label too long for a square card, a claim we would have to reject
                      at review, or an urgency line that makes the station read as an ad
                      network. The validator enforces the same list, so this is a rule
                      rather than a suggestion. */}
                  <div>
                    <label htmlFor="cta" className="block text-sm font-semibold mb-2">
                      Button label <span className="text-green-500">*</span>
                    </label>
                    <select id="cta" name="cta" value={form.cta} onChange={change} className={field}>
                      <option value="">Choose a label</option>
                      {CTA_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      This is the button on your sponsor card. If none of these fit, say
                      so below and we will sort it out with you.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="describe" className="block text-sm font-semibold mb-2">
                      What are you advertising? <span className="text-green-500">*</span>
                    </label>
                    <textarea id="describe" name="describe" rows={4} value={form.describe} onChange={change} className={field} placeholder="What the product or service is, and anything we should know before it airs." />
                  </div>

                  {/* A timeline, not a bare date picker.
                    *
                    * The date input was awkward on a phone and implied a precision we do
                    * not control: we review within two business days and the sponsor
                    * then chooses when to start, so a specific date was a commitment
                    * neither side had made.
                    *
                    * It also tells us nothing about the buyer. "As soon as you can" and
                    * "just exploring" are different conversations, and a date cannot
                    * distinguish them.
                    *
                    * The picker is still here for the sponsor who genuinely has a date --
                    * a launch, an event -- but only appears once they say so, so the
                    * awkward widget is in front of the few people who need it. */}
                  <div>
                    <label htmlFor="startTimeline" className="block text-sm font-semibold mb-2">
                      When would you like to start? <span className="text-green-500">*</span>
                    </label>
                    <select
                      id="startTimeline"
                      name="startTimeline"
                      value={form.startTimeline}
                      onChange={change}
                      className={field}
                    >
                      {START_TIMELINES.map((timeline) => (
                        <option key={timeline.id} value={timeline.id}>
                          {timeline.label}
                        </option>
                      ))}
                    </select>
                    {/* Answers "so what happens now?" at the moment it is asked.
                        Without it, an urgent applicant invents an expectation we never
                        agreed to and a browsing one assumes they are about to be sold
                        at. */}
                    <p className="text-sm text-gray-400 mt-2">
                      {startTimelineNote(form.startTimeline)}
                    </p>
                  </div>

                  {timelineNeedsDate(form.startTimeline) && (
                    <div>
                      <label htmlFor="preferredStart" className="block text-sm font-semibold mb-2">
                        Which date? <span className="text-green-500">*</span>
                      </label>
                      <input
                        id="preferredStart"
                        name="preferredStart"
                        type="date"
                        value={form.preferredStart}
                        onChange={change}
                        className={field}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        We will confirm we can hit it before anything is charged.
                      </p>
                    </div>
                  )}

                  {navButtons(false)}
                </div>
              )}

              {/* 4 — creative */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold">Your creative</h2>
                  <p className="text-sm text-gray-400">
                    We review everything before it airs. Audio up to {megabytesOf(AUDIO_SPEC)}MB, logo up to {megabytesOf(LOGO_SPEC)}MB.
                    Attachments are not saved if you reload, so add them just before you
                    submit.
                  </p>

                  {!wantsAudio && selectedTier && (
                    <p className="text-sm text-gray-400 bg-gray-900/50 rounded p-3">
                      {selectedTier.name} is a sponsor-card package — it carries no audio
                      spot, so there is nothing to upload but your logo. Go back and
                      choose Rotation or Featured if you want a spot on air.
                    </p>
                  )}

                  {wantsAudio && (
                    <>
                      {/* WAV first, which looks backwards for a web upload and is not:
                          the station transcodes to MP3 itself, so an MP3 here is encoded
                          twice and loses quality that cannot come back. */}
                      <FileDropzone
                        label="Your audio spot"
                        hint="WAV is best — we convert it ourselves, so an uncompressed file keeps the quality. MP3, M4A, FLAC, AIFF, AAC and OGG are fine too. Do not normalise or master it; we level every spot automatically."
                        accept={AUDIO_SPEC.accept}
                        file={form.audioFile}
                        maxBytes={AUDIO_SPEC.maxBytes}
                        onFile={setFile("audioFile")}
                      />

                      {/* Target BLOCK, never a duration. We cannot know the duration --
                          it changes when the station transcodes, and cue() sums declared
                          durations, so a wrong one permanently shifts every record after
                          it for every listener. */}
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
                          As a script that is{" "}
                          {(SPOT_BLOCKS.find((b) => b.id === form.spotBlock) || {}).words}. We
                          measure the finished file and will tell you if it needs trimming.
                        </p>
                      </div>

                      <label className="flex gap-3 items-start p-4 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer">
                        <input type="checkbox" name="wantsProduction" checked={form.wantsProduction} onChange={change} className="mt-1 w-5 h-5 accent-green-500" />
                        <span>
                          <span className="block font-semibold">
                            Produce the spot for me — no extra charge
                          </span>
                          <span className="block text-sm text-gray-400">
                            Included with {selectedTier ? selectedTier.name : "this package"}.
                            We write and record it from what you told us, and send it for
                            your approval. Nothing airs until you have approved it.
                          </span>
                        </span>
                      </label>

                      {/* Warned about, not blocked. Wanting us to write and record the
                          spot AND wanting to be on air quickly is the request most
                          likely to disappoint, because production is manual and has no
                          agreed turnaround. The combination is legitimate and usually
                          achievable, so refusing it would turn away business -- saying
                          so costs a sentence, and finding out after approval costs the
                          relationship. */}
                      {hasTightProductionTimeline(form) && (
                        <p className="text-sm text-amber-200 bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                          You have asked us to produce the spot and you would like to
                          start{" "}
                          {startTimelineLabel(form.startTimeline).toLowerCase()}. That is
                          usually fine, but writing and recording takes us a little time.
                          We will tell you honestly what is achievable when we review
                          this — before anything is charged.
                        </p>
                      )}
                    </>
                  )}

                  {/* The station re-encodes every logo to JPEG, so transparency is
                      flattened and SVG is not accepted. The slot is square. */}
                  <FileDropzone
                    label="Your logo"
                    hint={LOGO_GUIDANCE}
                    accept={LOGO_SPEC.accept}
                        file={form.logoFile}
                        maxBytes={LOGO_SPEC.maxBytes}
                    onFile={setFile("logoFile")}
                  />

                  {navButtons(false)}
                </div>
              )}

              {/* 5 — review */}
              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold">Check and submit</h2>

                  <dl className="bg-gray-800 rounded-lg p-5 space-y-2 text-sm">
                    {[
                      ["Package", selectedTier ? `${selectedTier.name} — ${formatMonthly(selectedTier)}` : "—"],
                      ["Programme", programNameFor(form.programId)],
                      ["Advertiser", form.company],
                      ["Contact", `${form.contactName} (${form.email})`],
                      ["Link", form.landingUrl],
                      ["Card line", form.blurb],
                      ["Button", form.cta],
                      [
                        "Start",
                        timelineNeedsDate(form.startTimeline)
                          ? form.preferredStart || "a date you have not picked yet"
                          : startTimelineLabel(form.startTimeline)
                      ],
                      ...(wantsAudio
                        ? [
                            ["Spot length", `:${form.spotBlock}`],
                            [
                              "Audio",
                              form.audioFile
                                ? form.audioFile.name
                                : form.wantsProduction
                                ? "We produce it"
                                : "none"
                            ]
                          ]
                        : []),
                      ["Logo", form.logoFile ? form.logoFile.name : "none"]
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-3">
                        <dt className="text-gray-500 w-32 flex-shrink-0">{label}</dt>
                        <dd className="text-gray-200 break-all">{value || "—"}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-5">
                    <h3 className="font-bold mb-2">We approve, then you pay</h3>
                    <p className="text-sm text-gray-400">
                      Submitting does not charge you. We review the spot, confirm it suits
                      the station, and come back within two business days. If we approve
                      it you choose when to start, and billing begins then. If we decline
                      it, you pay nothing and we tell you why.
                    </p>
                  </div>

                  {navButtons(true)}

                  <p className="text-xs text-gray-500 text-center">
                    By applying you agree to our{" "}
                    <Link to="/terms" className="text-gray-400 hover:underline">
                      Terms
                    </Link>
                    . We decline advertising we judge unsuitable for the station.
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
