import React, { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import {
  submitGeneralInquiry,
  validateGeneralInquiry,
  INQUIRY_SOURCES
} from "../services/studioInquiryService";

// This page said "Coming Soon" while /about told the same visitor that sync is
// "handled directly" and that we would "come back with terms". One fact, two pages,
// opposite answers -- and the wrong one was on the page the buyer actually lands on.
//
// Sync licensing is not coming: it WORKS, and has all along. BFMG holds both the
// recording and the composition, so a sync licence can be granted with one signature
// today. What does not exist is SELF-SERVICE sync -- instant quotes, a rate card, a
// project dashboard. That is a real distinction and the page now draws it, rather
// than describing an unbuilt product while hiding the working one.
//
// The removed claims were not aspirational, they were false: "instant quotes" (every
// quote is manual), "track all your licenses in one place" (no such screen exists),
// and an "Early Access" signup for a launch that is not scheduled and collected
// nothing. A visitor who believes "Coming Soon" leaves and does not come back.

// Value IS label, deliberately. These used to be slugs -- "tv", "video-game" -- which
// were stored verbatim and then rendered raw in the admin table, so the back office
// showed "video-game" where a human was reading. A machine slug is only worth the
// mapping it saves, and here it saved none: nothing switches on these values.
// TWO RIGHTS, NOT ONE LIST.
//
// This page offered only sync project types -- Film, Television, Commercial, Video
// Game, Podcast, YouTube, Corporate Video -- while the purchase dialog sends people
// here with the words "DJing, or playing music in a business? That needs a separate
// license." Neither of those is a sync use.
//
//   SYNC is pairing a recording with moving image. It is what a film, an advert or a
//   game needs.
//
//   PUBLIC PERFORMANCE is playing a recording to an audience or in a commercial
//   space. It is what a restaurant, a gym, a spa, a shop or a DJ needs.
//
// They are different rights and Terms.js already treats them as such: public
// performance is in the "not granted" list of every download licence, with the promise
// of "a separate license from us". A restaurant owner who read that, clicked through,
// and landed on a page about advertising campaigns had been answered with a different
// question. Both are quoted rather than sold from a rate card, so they share one form
// -- but the visitor has to be able to say which one they are asking about.
const LICENCE_KINDS = [
  {
    id: "sync",
    label: "Sync — film, TV, advertising, games",
    blurb:
      "Pairing a recording with moving image. One signature covers the recording and the composition.",
    types: [
      "Film",
      "Television",
      "Commercial / Advertisement",
      "Video Game",
      "Podcast",
      "YouTube / Social Media",
      "Corporate Video",
      "Other"
    ]
  },
  {
    id: "performance",
    label: "Public performance — business premises, DJ sets, events",
    blurb:
      "Playing recordings to an audience or in a commercial space. A download licence does not cover this, whoever you bought it from.",
    types: [
      "Restaurant / café",
      "Bar / club / nightlife",
      "Gym / fitness studio",
      "Spa / clinic / wellness",
      "Retail store",
      "Office / coworking space",
      "Hotel / hospitality",
      "DJ set",
      "Live event / conference",
      "Telephone on-hold",
      "Other"
    ]
  }
];

// What a sync licence from BFMG actually includes. Every line is checkable against
// the catalogue and the licence terms; nothing here describes an intention.
const WHAT_YOU_GET = [
  {
    title: "One-stop clearance",
    body:
      "We hold the recording and the composition. One licence covers both, so there is no publisher to clear separately."
  },
  {
    title: "Quoted per project",
    body:
      "Priced on media, term and territory rather than a fixed rate card. Tell us the use and we come back with terms."
  },
  {
    title: "AI provenance stated",
    body:
      "We tell you in writing how each recording was made. If your broadcaster or platform asks, you have the answer."
  },
  {
    title: "Direct from the owner",
    body:
      "You are dealing with the rights holder, not an agent representing one. Nobody has to be chased for approval."
  }
];

const EMPTY = { name: "", email: "", company: "", projectType: "", message: "", licenceKind: "sync" };

export default function SyncLicensing() {
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const activeKind =
    LICENCE_KINDS.find((k) => k.id === formData.licenceKind) || LICENCE_KINDS[0];

  // Switching the right CLEARS the project type. The two lists share no values, so
  // keeping the old one would submit "Video Game" against a public performance
  // enquiry -- a lead that reads as a mistake and has to be chased to mean anything.
  const handleKindChange = (e) =>
    setFormData((prev) => ({ ...prev, licenceKind: e.target.value, projectType: "" }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // The shared validator, not a local truthiness check. The old one tested that
    // name/email/message were non-empty and never checked the email was an ADDRESS,
    // so a typo produced a lead we had no way to answer -- indistinguishable, in the
    // back office, from a lead we simply had not replied to yet. Two forms feeding
    // one inbox must agree on what a valid enquiry is.
    const check = validateGeneralInquiry({
      name: formData.name,
      email: formData.email,
      topic: formData.projectType || activeKind.label,
      message: formData.message
    });
    if (!check.isValid) {
      setErrors(check.errors);
      return;
    }

    setErrors([]);
    setSubmitting(true);
    // Was: addDoc(collection(db, "syncLicensingInquiries"), ...) -- a collection with
    // a write and no reader. Every sync enquiry ever submitted landed somewhere nobody
    // opens while the sender saw "we will be in touch".
    const result = await submitGeneralInquiry({
      name: formData.name,
      email: formData.email,
      company: formData.company,
      topic: formData.projectType || activeKind.label,
      message: formData.message,
      // The SOURCE follows the right being asked about. A venue enquiry filed under
      // "Sync Licensing" is answered by whoever handles adverts, with a quote shaped
      // for a campaign -- the lead arrives, and arrives wrong.
      source: activeKind.id === "performance"
        ? INQUIRY_SOURCES.PERFORMANCE
        : INQUIRY_SOURCES.SYNC
    });
    setSubmitting(false);

    if (result.success) {
      // The service's message, not a second copy of it. This page used to promise
      // "24-48 hours" while the service returned "two business days" and the footnote
      // below said something else again -- three statements of one commitment, free to
      // drift apart, and the visitor believed whichever one they read.
      setSubmitted(result.message);
      setFormData(EMPTY);
    } else {
      setErrors([result.message]);
    }
  };

  // One definition. 16px text keeps mobile Safari from zooming the page on focus;
  // 44px min-height keeps the control a thumb target rather than a cursor target.
  const field =
    "w-full min-h-[44px] text-base bg-gray-700 text-white p-3 rounded border " +
    "border-gray-600 focus:border-green-500 focus:outline-none";

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-16 sm:py-20">
          {/* Heading */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-600 to-blue-600 rounded-full">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* The H1 named one right while the page is the destination for two.
                The purchase dialog links here with "DJing, or playing music in a
                business?", so a visitor arriving on "Sync Licensing" had been sent to
                a page that did not mention their question. */}
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Licensing</h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Sync for film, television, advertising and games — and public performance
              for business premises, DJ sets and events. Licensed directly by the
              company that owns the recording and the composition.
            </p>
          </div>

          {/* What a licence includes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.title} className="bg-gray-800 rounded-lg p-5">
                <h2 className="font-bold text-green-500 mb-2">{item.title}</h2>
                <p className="text-sm text-gray-400">{item.body}</p>
              </div>
            ))}
          </div>

          {/* How it works -- stated plainly, because the absence of a checkout button
              is the single most likely reason a visitor leaves this page. */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-12">
            <h2 className="text-xl font-bold mb-3">How it works</h2>
            <ol className="list-decimal list-inside text-gray-400 space-y-2">
              <li>Tell us about the project below — what it is, where it runs, for how long.</li>
              <li>We come back with terms and a quote, usually within two business days.</li>
              <li>
                On agreement we issue the licence and deliver the master. One signature
                covers both the recording and the composition.
              </li>
            </ol>
            <p className="text-sm text-gray-500 mt-4">
              Both are quoted rather than sold from a rate card, because a national
              advertisement and a student film are not the same number, and neither are
              one café and a gym chain. If you want a track for personal or
              small-scale use instead,{" "}
              <Link to="/browse/library" className="text-gray-300 hover:underline">
                browse the library
              </Link>{" "}
              — those licences are issued at checkout.
            </p>
            {/* Stated here rather than left for the quote, because it is the single
                most common misunderstanding this page exists to correct: a download
                licence is not a performance licence, from us or from anyone. */}
            <p className="text-sm text-gray-500 mt-3">
              Playing music in a business is a <strong className="text-gray-300">public
              performance</strong>, which no download licence covers — ours or any
              other seller&rsquo;s. It is a separate right, and this is where you ask
              for it.
            </p>
          </div>

          {/* Enquiry form */}
          <div className="bg-gray-800 rounded-lg p-6 sm:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center">Tell us about your project</h2>
            <p className="text-gray-400 mb-6 text-center text-sm">
              The more you can say about the use, the closer the first quote will be.
            </p>

            {submitted ? (
              <div
                role="status"
                className="bg-green-900/30 border border-green-700 rounded-lg p-6 text-center"
              >
                <p className="text-green-500 font-semibold mb-2">Enquiry received</p>
                <p className="text-gray-300 text-sm mb-4">{submitted}</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(null)}
                  className="min-h-[44px] px-5 text-base bg-gray-700 hover:bg-gray-600 rounded-full font-medium"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {errors.length > 0 && (
                  <div
                    role="alert"
                    className="bg-red-900/30 border border-red-700 rounded-lg p-4"
                  >
                    <ul className="list-disc list-inside text-red-200 space-y-1 text-sm">
                      {errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Name <span className="text-green-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={field}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">
                    Email <span className="text-green-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={field}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold mb-2">
                    Company / Organization{" "}
                    <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    autoComplete="organization"
                    value={formData.company}
                    onChange={handleChange}
                    className={field}
                    placeholder="Company name"
                  />
                </div>

                {/* WHICH RIGHT, asked before what the project is.
                    The answer changes the list below AND the inbox the enquiry lands
                    in, so it cannot be inferred from a project type -- "Other" means
                    nothing without it. */}
                <div>
                  <label htmlFor="licenceKind" className="block text-sm font-semibold mb-2">
                    What do you need? <span className="text-green-500">*</span>
                  </label>
                  <select
                    id="licenceKind"
                    name="licenceKind"
                    value={formData.licenceKind}
                    onChange={handleKindChange}
                    className={field}
                  >
                    {LICENCE_KINDS.map((kind) => (
                      <option key={kind.id} value={kind.id}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">{activeKind.blurb}</p>
                </div>

                <div>
                  <label htmlFor="projectType" className="block text-sm font-semibold mb-2">
                    {activeKind.id === "performance" ? "Where will it play?" : "Project type"}
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    className={field}
                  >
                    <option value="">
                      {activeKind.id === "performance" ? "Select a venue type" : "Select a project type"}
                    </option>
                    {activeKind.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold mb-2">
                    About the project <span className="text-green-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={field}
                    placeholder="Where will it run, for how long, and in which territories? If you already have a track in mind, name it."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full min-h-[48px] text-base rounded-full font-semibold transition-colors ${
                    submitting
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {submitting ? "Sending..." : "Send enquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
