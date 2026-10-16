import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { allChanges, formatChangeDate, markChangesSeen } from "../data/platformChanges";

// src/pages/Changes.js — /changes
//
// What changed, for the person it changed for.
//
// WHY THIS PAGE EXISTS AND WHAT IT IS NOT
// It is not a release log. Deploys, bug fixes and refactors are not here on purpose: if
// a reader would not do anything differently, it is not an entry, and a page that mostly
// says "fixed a redirect rule" teaches people the link is worthless -- so when the terms
// genuinely change, nobody clicks.
//
// The load-bearing job is a promise /terms makes: the version you accepted, and not any
// later revision of that page, governs your purchase. That promise is only keepable if
// the superseded text still exists somewhere you can READ. It did not. Editing Terms.js
// on 2026-10-15 overwrote wording that is still in force for two purchases, and
// `npm run verify:terms` had been printing "the old version must stay readable, not be
// overwritten" the whole time.
//
// So every version is shown, including the old ones, with the summary AS IT STOOD. A
// buyer on an earlier version reads their own deal here instead of emailing to ask for
// it. That is also why the entries are generated from AGREEMENT_HISTORY rather than
// written by hand: a hand-kept list goes stale the first time someone is busy, and a
// stale page about what you agreed to is worse than none.

export default function Changes() {
  const changes = allChanges();

  // Marked on OPENING the page, not on dismissing the prompt. Closing a modal is not
  // reading, and treating it as read would quietly consume the single notice a license
  // change gets. Once marked, the update prompt stops offering the link until something
  // newer appears.
  useEffect(() => {
    markChangesSeen();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">What's changed</h1>
          <p className="text-xl text-gray-400 mb-4">
            Changes that affect what you get, in plain terms.
          </p>
          <p className="text-gray-400 mb-12">
            Only things you might act on are listed here — changes to your license, prices, or
            what the platform does. Routine fixes and improvements are not.
          </p>

          {changes.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-6 mb-12">
              <p className="text-gray-300">
                Nothing to report yet. When something changes that affects your license or what
                you get, it will appear here.
              </p>
            </div>
          )}

          <div className="space-y-8 mb-12">
            {changes.map((change) => (
              <article
                key={change.identifier || `${change.kind}-${change.date}`}
                className="bg-gray-800 rounded-lg p-6"
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <time dateTime={change.date} className="text-sm text-gray-400">
                    {formatChangeDate(change.date)}
                  </time>

                  {change.kind === "terms" && (
                    /* "In force" vs "Still applies to purchases made before ..." rather than
                     * "current" vs "old". A superseded version is not void -- it still
                     * governs every purchase that accepted it, and calling it old would
                     * tell exactly the wrong story to the person it still binds. */
                    <span
                      className={
                        change.inForce
                          ? "text-xs font-semibold px-2 py-1 rounded bg-green-900/50 text-green-400"
                          : "text-xs font-semibold px-2 py-1 rounded bg-gray-700 text-gray-300"
                      }
                    >
                      {change.inForce ? "In force now" : "Still applies to earlier purchases"}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-2">{change.headline}</h2>

                {change.kind === "terms" && (
                  <p className="text-sm text-gray-500 mb-4">
                    {change.agreementLabel} ·{" "}
                    <code className="text-gray-400">{change.identifier}</code>
                  </p>
                )}

                {change.points.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2 text-gray-300 mb-4">
                    {change.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}

                {change.summary && (
                  <details className="mt-4 bg-gray-900/60 rounded p-4">
                    {/* The exact wording of this version, so someone holding it can read
                      * what they agreed to without asking anyone. Collapsed because most
                      * readers want the bullets; available because some need the text. */}
                    <summary className="cursor-pointer text-green-500 font-semibold">
                      Read the license summary for this version
                    </summary>
                    <p className="text-gray-300 mt-3 text-sm leading-relaxed">{change.summary}</p>
                    <p className="text-gray-500 mt-3 text-xs">
                      Recorded against purchases as <code>{change.identifier}</code>. If this is
                      the version on your purchase, these are the terms that govern it.
                    </p>
                  </details>
                )}
              </article>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-2">Which version applies to me?</h3>
            <p className="text-gray-300 mb-3">
              The version you accepted at the time of purchase governs that purchase, and a later
              change here does not alter it. Your purchase history shows which version you accepted.
            </p>
            <p className="text-gray-300">
              If anything here is unclear, or you want the full text rather than the summary,{" "}
              <Link
                to="/contact"
                className="inline-flex items-center min-h-11 text-green-500 hover:underline"
              >
                get in touch
              </Link>
              .
            </p>
          </div>

          <p className="text-gray-400">
            <Link to="/terms" className="text-green-500 hover:underline">
              Read the current Terms →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
