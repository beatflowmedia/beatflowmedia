import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  SPONSOR_TIERS,
  stripePriceIdFor,
  canCheckout,
  formatMonthly
} from "../data/sponsorshipTiers";
import { latestApplicationFor, canPay } from "../services/sponsorApplicationService";

// /advertising was linked from /about-ads ("Learn About Advertising") and did not
// exist -- the route was never registered, so the one call-to-action aimed at
// advertisers led nowhere. This is that page.
//
// It sells AIRINGS, not audience, and says so. BeatFlow Radio measures nothing about
// its listeners: no tune-in count, no sessions, and a sponsor-card beacon that points
// at null. What it CAN prove is how many times a spot ran, exactly, because the
// schedule is a pure function of the clock. Selling impressions would mean invoicing
// against a number nobody can produce; selling airings is a promise the station keeps
// today and can audit on demand.
//
// The honesty is not only ethics, it is the cheaper option. An advertiser who is told
// up front that there is no audience figure can decide with open eyes. One who finds
// out after paying asks for a refund and tells people.

export default function Advertising() {
  const { user } = useAuth();
  const [busyTier, setBusyTier] = useState(null);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);

  // Whether this visitor may pay at all, and for which package. Payment is unlocked
  // by an APPROVED application and by nothing else -- see sponsorApplicationService.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const app = await latestApplicationFor(user);
      if (!cancelled) setApplication(app);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const approvedTierId = canPay(application) ? application.tierId : null;

  const startCheckout = async (tier) => {
    setError(null);

    // Stripe needs a customer to attach a subscription to, and the back office needs
    // to know whose sponsorship it is. Sending an anonymous visitor to checkout
    // produces a payment we cannot reconcile to anyone.
    if (!user) {
      setError("Please sign in first so we can attach the sponsorship to your account.");
      return;
    }

    setBusyTier(tier.id);
    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: stripePriceIdFor(tier),
          userId: user.uid,
          userEmail: user.email
        })
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("Sponsorship checkout failed:", err);
      setError(
        "We could not start checkout. Please try again, or send us an enquiry and we will set it up manually."
      );
      setBusyTier(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-12 sm:py-16">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Sponsor BeatFlow Radio
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              A recorded spot in the rotation and your card on the player, sold
              directly by the station. Monthly, cancel any time.
            </p>
          </div>

          {/* What we can and cannot tell you. This block is the reason the rest of
              the page is credible -- a sponsor who reads it knows exactly what they
              are buying, and nothing later comes as a surprise. */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-6 mb-12">
            <h2 className="text-xl font-bold mb-3">What we can prove</h2>
            <p className="text-gray-300 mb-4">
              We report <strong>airings</strong> — exactly how many times your spot ran,
              and when. The station schedule is deterministic, so those counts are
              arithmetic rather than estimates, and we will show you the working.
            </p>
            <p className="text-gray-400 text-sm">
              We do <strong>not</strong> currently measure audience size. BeatFlow Radio
              does not count listeners, so we cannot tell you how many people heard your
              spot, and we will not quote you a reach figure we cannot stand behind. If
              audience numbers are essential to your buy, this is not the right placement
              yet — and we would rather say that now than invoice you for it.
            </p>
          </div>

          {/* How this works. Stated before the packages, because the absence of a
              "buy now" button is otherwise the first thing a visitor notices and the
              first thing they get wrong. Ordered the way a self-serve ad platform
              orders it -- Roku Ads Manager: "Create your account" / "Choose your
              objective and target audience" / "Upload your creative for approval" /
              "Launch your campaign and measure results". Payment is not one of the
              four; it attaches at launch, after approval. */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-6 mb-12">
            <h2 className="text-xl font-bold mb-3">How sponsorship works</h2>
            <ol className="list-decimal list-inside text-gray-400 space-y-2">
              <li>Pick a package and apply — it takes a few minutes.</li>
              <li>
                Send us your spot and logo, or ask us to produce the spot for you.
              </li>
              <li>
                We review it. We decline advertising that does not suit the station,
                and we tell you before any money changes hands.
              </li>
              <li>
                Once approved, you choose when to start. <strong>Billing begins
                then</strong> — never at application.
              </li>
            </ol>
          </div>

          {/* Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {SPONSOR_TIERS.map((tier) => {
              const buyable = canCheckout(tier);
              return (
                <div
                  key={tier.id}
                  className="bg-gray-800 rounded-lg p-6 flex flex-col"
                >
                  <h2 className="text-2xl font-bold mb-1">{tier.name}</h2>
                  <p className="text-3xl font-bold text-green-500 mb-4">
                    {formatMonthly(tier)}
                  </p>
                  <p className="text-gray-400 text-sm mb-4">{tier.summary}</p>

                  <ul className="text-gray-300 text-sm space-y-2 mb-6 flex-1">
                    {tier.includes.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-green-500" aria-hidden="true">
                          ✓
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  {/* APPLY, never "pay now".
                    *
                    * This button briefly opened Stripe Checkout directly, which was
                    * wrong in two ways that reinforce each other.
                    *
                    * Operationally: a card payment tells you that money arrived and
                    * nothing else. No company, no contact, no landing URL, no logo,
                    * no audio. You would hold a live monthly subscription with no
                    * idea what to broadcast, and the sponsor would be paying from
                    * day one for airtime that cannot run.
                    *
                    * Editorially: this page promises "we decline advertising we
                    * judge unsuitable for the station, and we say so BEFORE taking
                    * payment rather than after". Charging first makes that sentence
                    * false, and declining afterwards means refunding someone you
                    * have already annoyed. You cannot let a stranger onto the
                    * station by credit card and review it later -- the spot airs
                    * under BFMG's name.
                    *
                    * So: apply, be approved, then pay. Checkout stays built and is
                    * reached after approval. */}
                  {approvedTierId === tier.id && buyable ? (
                    // Approved for THIS package. Only now does a pay button exist.
                    <button
                      type="button"
                      onClick={() => startCheckout(tier)}
                      disabled={busyTier === tier.id}
                      className="w-full min-h-[48px] text-base rounded-full font-semibold bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {busyTier === tier.id ? "Starting…" : "Start my sponsorship"}
                    </button>
                  ) : (
                    <Link
                      to={`/advertising/apply?tier=${tier.id}`}
                      className="w-full min-h-[48px] flex items-center justify-center text-base rounded-full font-semibold bg-green-600 hover:bg-green-500 transition-colors"
                    >
                      Apply for {tier.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8 max-w-2xl mx-auto"
            >
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Everything else */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3">Something else in mind?</h2>
            <p className="text-gray-400 mb-4">
              Campaign-length buys, a season sponsorship, or a placement that is not
              listed above — tell us what you are trying to do and we will quote it.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center min-h-[44px] px-6 text-base bg-gray-700 hover:bg-gray-600 rounded-full font-semibold transition-colors"
            >
              Send an enquiry
            </Link>
            <p className="text-sm text-gray-500 mt-6">
              Sponsorships are subject to our{" "}
              <Link to="/terms" className="text-gray-300 hover:underline">
                Terms
              </Link>
              . We decline advertising we judge unsuitable for the station, and we say
              so before taking payment rather than after.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
