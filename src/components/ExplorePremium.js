// src/components/ExplorePremium.jsx
import { useRef } from "react";
import { FaCcVisa, FaCcMastercard, FaCcStripe } from "react-icons/fa";
import StripeButton from "./StripeButton";
import Footer from "./Footer";

const plans = [
  {
    title: "Student",
    price: "$9.99/month",
    details: [
      "Commercial licensing included",
      "Unlimited downloads",
      "YouTube, TikTok, Instagram",
      "Podcast licensing",
      "Requires .edu email",
    ],
    label: "Get Student Plan",
    note: "Educational discount with commercial licensing. Requires verification.",
    tag: "🎓 Student Deal",
    priceId: process.env.REACT_APP_STRIPE_STUDENT_PRICE_ID || "price_1RPG6sAEum2hO0KZGTDZIqOr"
  },
  {
    title: "Creator",
    price: "$24/month",
    details: [
      "Unlimited downloads",
      "Published content licensed perpetually",
      "YouTube, TikTok, Instagram, Podcast",
      "Cancel anytime, keep your licenses",
      "Commercial use included",
    ],
    label: "Get Creator Plan",
    note: "Perfect for content creators. Keep licenses forever after publishing.",
    tag: "⭐ Most Popular",
    priceId: process.env.REACT_APP_STRIPE_CREATOR_PRICE_ID || "price_1RPFZuAEum2hO0KZ6R9hDDBS"
  },
  {
    title: "Pro",
    price: "$49/month",
    details: [
      "Everything in Creator, plus:",
      "Film & TV distribution rights",
      "Client work & agency projects",
      "Broadcast rights",
      "Priority support",
    ],
    label: "Get Pro Plan",
    note: "For professional video producers and agencies working with clients.",
    tag: "Professional",
    priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID || "price_1RPGGGAEum2hO0KZbsLLd4x1"
  },
  {
    title: "Agency",
    price: "$149/month",
    details: [
      "Everything in Pro, plus:",
      "3 team member accounts",
      "Unlimited client projects",
      "White-label options",
      "Dedicated account manager",
    ],
    label: "Get Agency Plan",
    note: "For agencies and teams managing multiple client projects.",
    tag: "Enterprise",
    priceId: process.env.REACT_APP_STRIPE_AGENCY_PRICE_ID || "price_1RPGOLAEum2hO0KZ7tHXcspp"
  },
];

export default function ExplorePremium() {
  const plansRef = useRef(null);
  const scrollToPlans = () =>
    plansRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="flex flex-col min-h-screen bg-bf-page text-bf-text">
      {/* Hero */}
      <section className="bg-bf-card py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-2">License Music for Your Content.</h1>
          <p className="text-base sm:text-lg text-bf-subtext mb-8">
            Unlimited downloads. Keep licenses forever. Support independent artists.
          </p>
          <div className="flex gap-4 max-w-lg mx-auto">
            <StripeButton
              priceId={plans[1].priceId}
              className="flex-1 bg-bf-green text-white font-semibold py-3 rounded-full hover:opacity-90 transition text-center"
            >
              Get Creator Plan
            </StripeButton>
            <button
              onClick={scrollToPlans}
              className="flex-1 border border-bf-green text-bf-green font-semibold py-3 rounded-full hover:bg-bf-green hover:text-white transition text-center"
            >
              View all plans
            </button>
          </div>
        </div>
      </section>

      {/* Payment Icons */}
      <section className="py-8 text-center">
        <div className="flex justify-center gap-6 text-3xl">
          <FaCcVisa className="text-bf-text hover:text-white transition" />
          <FaCcMastercard className="text-bf-text hover:text-white transition" />
          <FaCcStripe className="text-bf-text hover:text-white transition" />
        </div>
      </section>

      {/* Plans */}
      <section
        ref={plansRef}
        id="plans"
        className="py-12 px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-bf-subtext mb-8 max-w-2xl mx-auto">
          Choose the plan that fits your needs. Download unlimited music, get perpetual licenses, and support independent artists. Cancel anytime.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className="bg-bf-card p-6 rounded-lg flex flex-col h-full"
            >
              <div>
                <div className="bg-bf-green text-white text-center py-2 rounded-full text-sm font-medium mb-4">
                  {plan.tag}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                <p className="text-sm text-bf-subtext mb-4">{plan.price}</p>
                <ul className="text-bf-subtext text-sm space-y-1 mb-6">
                  {plan.details.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>

              {/* CTA & note */}
              <div className="mt-auto flex flex-col">
                <StripeButton
                  priceId={plan.priceId}
                  className="bg-bf-green text-white font-semibold py-2 rounded-full hover:opacity-90 transition text-center mb-2"
                >
                  {plan.label}
                </StripeButton>
                <p className="text-xs text-bf-subtext text-center">
                  {plan.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          Why Choose BeatFlow Premium?
        </h2>
        <p className="text-center text-bf-subtext mb-8">
          Get licensed music for your content. Download unlimited tracks and keep your licenses forever. Cancel anytime.
        </p>
        <div className="max-w-4xl mx-auto bg-bf-card rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-bf-page">
              <tr>
                <th className="p-4 text-sm text-bf-subtext">Feature</th>
                <th className="p-4 text-sm text-bf-subtext text-center">
                  Free
                </th>
                <th className="p-4 text-sm text-bf-subtext text-center">
                  Subscription
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                "Download tracks for your content",
                "Commercial licensing",
                "YouTube, TikTok, Instagram use",
                "Perpetual licenses (keep forever)",
                "Ad-free listening",
                "High-quality audio downloads",
              ].map((feat, i) => (
                <tr key={i} className="border-b border-bf-page">
                  <td className="p-4">{feat}</td>
                  <td className="p-4 text-center">✖</td>
                  <td className="p-4 text-center">✔</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
