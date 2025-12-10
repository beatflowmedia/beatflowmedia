// src/components/ExplorePremium.jsx
import React, { useRef } from "react";
import { FaCcVisa, FaCcMastercard, FaCcStripe } from "react-icons/fa";
import StripeButton from "./StripeButton";
import Footer from "./Footer";

const plans = [
  {
    title: "Individual",
    price: "$11.99 / month after",
    details: [
      "1 Premium account",
      "Cancel anytime",
      "15-hour/month of listening time from our audiobooks",
    ],
    label: "Try free for 1 month",
    note: "Free for 1 month, then $11.99/month after.",
    tag: "Free for 1 month",
    priceId: "price_4gMeVcbdS11GbeX13t2cg00"
  },
  {
    title: "Student",
    price: "$9.99 / month after",
    details: [
      "1 verified Premium account",
      "Discount for eligible students",
      "Same benefits as Individual",
    ],
    label: "Try free for 1 month",
    note: "Free for 1 month, then $9.99/month after.",
    tag: "Free for 1 month",
    priceId: "price_eVq6oG3Lq8u83Mv8wV2cg01"
  },
  {
    title: "Duo",
    price: "$16.99 / month after",
    details: [
      "2 Premium accounts",
      "For couples under one roof",
      "Plan manager only",
    ],
    label: "Get Premium Duo",
    note: "For couples who reside at the same address.",
    tag: "Free for 1 month",
    priceId: "price_dRm4gy2HmcKodn5cMb2cg02"
  },
  {
    title: "Family",
    price: "$18.00 / month",
    details: [
      "Up to 6 Premium or Kids accounts",
      "Control content marked as explicit",
      "Access to BeatFlow Kids",
      "Plan manager only",
    ],
    label: "Get Premium Family",
    note: "For couples or families who reside at the same address.",
    tag: "Popular",
    priceId: "price_bJe4gybdS5hWaaT13t2cg03"
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
          <h1 className="text-5xl font-bold mb-2">Listen without limits.</h1>
          <p className="text-base sm:text-lg text-bf-subtext mb-8">
            Try 1 month free. Cancel anytime.
          </p>
          <div className="flex gap-4 max-w-lg mx-auto">
            <StripeButton
              priceId={plans[0].priceId}
              className="bg-bf-green text-white font-semibold py-3 rounded-full hover:opacity-90 transition text-center"
            >
              Get started
            </StripeButton>
            <button
              onClick={scrollToPlans}
              className="flex-1 border border-bf-green text-bf-green font-semibold py-3 rounded-full hover:bg-bf-green hover:text-white transition text-center"
            >
              View plans
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
          Affordable plans for any situation
        </h2>
        <p className="text-bf-subtext mb-8 max-w-2xl mx-auto">
          Choose a Premium plan and listen to ad-free music on all your devices.
          Pay in various ways. Cancel anytime.
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
          Experience the difference
        </h2>
        <p className="text-center text-bf-subtext mb-8">
          Go Premium and enjoy full control of your listening. Cancel anytime.
        </p>
        <div className="max-w-4xl mx-auto bg-bf-card rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-bf-page">
              <tr>
                <th className="p-4 text-sm text-bf-subtext">What you get</th>
                <th className="p-4 text-sm text-bf-subtext text-center">
                  Free
                </th>
                <th className="p-4 text-sm text-bf-subtext text-center">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                "Ad-free music listening",
                "Download songs",
                "High-quality audio",
                "Listen with fewer ads",
                "Organize listening space",
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
