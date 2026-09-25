import React, { useState } from "react";
import Footer from "../components/Footer";
import {
  submitGeneralInquiry,
  validateGeneralInquiry,
  INQUIRY_SOURCES
} from "../services/studioInquiryService";

// This page used to be a Spotify About page with the name swapped -- "millions of
// tracks and podcasts", "Simply tweet the team" -- sitting under a heading that said
// Contact, with no way to contact anyone. The only actual mechanism was a mailto to
// office@, beside a home street address published to the open web.
//
// It is now a form that writes into `studioInquiries`, the collection the admin
// dashboard already reads. That matters more than it looks: a message in the back
// office has a status, an owner and a record that it was answered. A mailto has none
// of those, and an unanswered licensing enquiry is a sale that quietly did not happen.
//
// No street address. A published home address is a safety exposure, not a trust
// signal, and nothing requires one HERE -- the legal contact obligations are
// discharged by the Terms and the Privacy Policy, which is where a reader (and a
// regulator) looks for them.

// The topics are the ones we can actually route. Keep this list short: a topic with
// no owner in the back office is a promise we cannot keep.
const TOPICS = [
  "Licensing a track or album",
  "Sync licensing (film, TV, advertising, games)",
  "My account, downloads or receipts",
  "Rights, legal or takedown",
  "Something else"
];

const EMPTY = { name: "", email: "", company: "", topic: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const check = validateGeneralInquiry(form);
    if (!check.isValid) {
      setErrors(check.errors);
      return;
    }
    setErrors([]);
    setSending(true);
    // Sync enquiries are flagged at source so the back office can triage them
    // first -- they are the highest-value messages this form carries.
    const source = form.topic.startsWith("Sync")
      ? INQUIRY_SOURCES.SYNC
      : INQUIRY_SOURCES.CONTACT;
    const result = await submitGeneralInquiry({ ...form, source });
    setSending(false);
    if (result.success) {
      setSent(result.message);
      setForm(EMPTY);
    } else {
      setErrors([result.message]);
    }
  };

  // Shared so every control is the same height and the same 16px text. Below 16px
  // mobile Safari zooms the whole page on focus; below 44px tall the control is a
  // cursor target on a device nobody is using a cursor on.
  const field =
    "w-full min-h-[44px] text-base bg-gray-800 border border-gray-700 rounded-lg " +
    "px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 " +
    "focus:ring-green-500 focus:border-transparent";

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Form */}
          <div>
            <h1 className="text-4xl font-bold mb-3">Contact us</h1>
            <p className="text-gray-400 mb-8">
              Send us a message and it goes straight to the team, where we track it
              through to an answer. We reply within two business days.
            </p>

            {sent ? (
              <div
                role="status"
                className="bg-green-900/30 border border-green-700 rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold mb-2">Message sent</h2>
                <p className="text-gray-300 mb-4">{sent}</p>
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className="min-h-[44px] px-5 text-base bg-gray-700 hover:bg-gray-600 rounded-full font-medium"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {errors.length > 0 && (
                  <div
                    role="alert"
                    className="bg-red-900/30 border border-red-700 rounded-lg p-4"
                  >
                    <ul className="list-disc list-inside text-red-200 space-y-1">
                      {errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block mb-2 font-medium">
                    Your name <span className="text-green-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    className={field}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 font-medium">
                    Email <span className="text-green-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className={field}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block mb-2 font-medium">
                    Company{" "}
                    <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={handleChange}
                    className={field}
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block mb-2 font-medium">
                    What is this about? <span className="text-green-500">*</span>
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    className={field}
                  >
                    <option value="">Choose a topic</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2 font-medium">
                    Message <span className="text-green-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you need. If it is about a specific track or album, the title helps."
                    className={field}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto min-h-[48px] px-8 text-base bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full font-semibold transition-colors"
                >
                  {sending ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* Other routes */}
          <div className="lg:pt-24">
            <h2 className="text-xl font-semibold mb-4">Other ways to get help</h2>
            <ul className="text-gray-400 space-y-5 mb-10">
              <li>
                <a href="/support" className="text-white hover:underline">
                  Help centre
                </a>
                <br />
                Answers to common questions about licensing, downloads and your account.
              </li>
              <li>
                <a href="/sync-licensing" className="text-white hover:underline">
                  Sync licensing
                </a>
                <br />
                For film, television, advertising and games. Handled directly rather
                than through checkout.
              </li>
              <li>
                <a href="/accessibility" className="text-white hover:underline">
                  Accessibility
                </a>
                <br />
                Tell us where the site fails you and we will fix it.
              </li>
            </ul>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-300">BeatFlow Media Group</strong>
                <br />
                Middletown, New Jersey, United States
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Our registered postal address and legal contacts are in our{" "}
                <a href="/terms" className="text-gray-300 hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="text-gray-300 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
