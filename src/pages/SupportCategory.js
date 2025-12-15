import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { FiChevronDown, FiChevronUp, FiArrowLeft } from "react-icons/fi";

export default function SupportCategory() {
  const { region = "us", category } = useParams();
  const [openIndex, setOpenIndex] = useState(null);

  // Map category slugs to readable titles
  const categoryTitles = {
    "payments-and-billing": "Payments & Billing",
    "manage-your-account": "Manage Your Account",
    "premium-plans": "Premium Plans",
    "in-app-features": "In-App Features",
    "devices-and-troubleshooting": "Devices & Troubleshooting",
    "safety-and-privacy": "Safety & Privacy",
  };

  // Category-specific articles
  const categoryArticles = {
    "payments-and-billing": [
      {
        question: "How do I update my payment method?",
        answer: "Go to Account Settings > Payment Method and click 'Update Payment Info'. You can add a new credit card, PayPal account, or other payment methods."
      },
      {
        question: "Why was I charged twice?",
        answer: "Double charges are typically temporary authorization holds that will drop off within 3-5 business days. If the charge persists, contact our support team with your transaction details."
      },
      {
        question: "How do I cancel my Premium subscription?",
        answer: "Visit Account Settings > Subscription > Cancel Premium. You'll retain access until the end of your current billing period."
      },
      {
        question: "Can I get a refund?",
        answer: "Refunds are evaluated on a case-by-case basis. Submit a refund request through your Account Settings or contact support within 14 days of the charge."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and mobile payment methods like Apple Pay and Google Pay."
      },
    ],
    "manage-your-account": [
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page, enter your email address, and follow the instructions in the reset email."
      },
      {
        question: "How do I change my email address?",
        answer: "Go to Account Settings > Profile > Email Address. Enter your new email and confirm with your password."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, go to Account Settings > Privacy > Delete Account. This action is permanent and will remove all your playlists, followers, and saved content."
      },
      {
        question: "How do I manage notification settings?",
        answer: "Navigate to Account Settings > Notifications to customize email, push, and in-app notification preferences."
      },
    ],
    "premium-plans": [
      {
        question: "What's included in Premium?",
        answer: "Premium includes ad-free listening, offline downloads, unlimited skips, high-quality audio, and on-demand playback on any device."
      },
      {
        question: "Can I try Premium for free?",
        answer: "Yes! New users get a 30-day free trial of Premium. Cancel anytime before the trial ends to avoid charges."
      },
      {
        question: "What's the difference between Premium plans?",
        answer: "Individual ($10.99/mo) is for one person. Duo ($14.99/mo) is for two people living at the same address. Family ($16.99/mo) supports up to 6 accounts. Student ($5.99/mo) requires verification."
      },
      {
        question: "Can I switch between Premium plans?",
        answer: "Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle."
      },
    ],
    "in-app-features": [
      {
        question: "How do I create a playlist?",
        answer: "Click 'Create Playlist' in your library, give it a name, and start adding songs by searching or browsing your library."
      },
      {
        question: "How do I download music for offline listening?",
        answer: "Premium users can toggle the 'Download' switch on any playlist or album to save it for offline playback."
      },
      {
        question: "What is the Queue feature?",
        answer: "The Queue shows what's playing next. You can add, remove, or reorder songs, and clear the queue at any time."
      },
      {
        question: "How do I share a song or playlist?",
        answer: "Click the three-dot menu next to any song, album, or playlist and select 'Share'. You can copy the link or share directly to social media."
      },
    ],
    "devices-and-troubleshooting": [
      {
        question: "Why won't the app open?",
        answer: "Try force-quitting and reopening the app. If that doesn't work, uninstall and reinstall from your app store."
      },
      {
        question: "Why is playback skipping or buffering?",
        answer: "Check your internet connection. For Premium users, try downloading content for offline playback. Lower audio quality in settings if on a slow connection."
      },
      {
        question: "How do I connect to Bluetooth speakers?",
        answer: "Enable Bluetooth on your device, pair with your speaker, and select it as the output device in the app's playback menu."
      },
      {
        question: "Which devices are supported?",
        answer: "BeatFlow Media is available on iOS (12+), Android (5.0+), Windows, macOS, Web browsers, smart speakers (Alexa, Google Home), and gaming consoles."
      },
    ],
    "safety-and-privacy": [
      {
        question: "How is my data used?",
        answer: "We use your data to personalize recommendations, improve our service, and show relevant ads (free tier). See our Privacy Policy for full details."
      },
      {
        question: "Can I make my profile private?",
        answer: "Yes, go to Account Settings > Privacy and toggle 'Private Profile'. This hides your listening activity and followers from other users."
      },
      {
        question: "How do I block or report someone?",
        answer: "Visit the user's profile, click the three-dot menu, and select 'Block' or 'Report'. Provide details about the issue if reporting."
      },
      {
        question: "What should I do if my account was hacked?",
        answer: "Immediately change your password, sign out of all devices in Account Settings, and contact our security team at security@beatflowmedia.com."
      },
    ],
  };

  const title = categoryTitles[category] || "Support Category";
  const articles = categoryArticles[category] || [];

  return (
    <div className="flex flex-col min-h-screen bg-bf-page">
      <NavBar />
      <main className="flex-1 bg-bf-page text-white">
        <div className="pt-16" />

        {/* Breadcrumb and header */}
        <section className="max-w-6xl mx-auto p-6">
          <Link to="/support" className="text-bf-green hover:underline flex items-center mb-4">
            <FiArrowLeft className="mr-2" />
            Back to Support
          </Link>
          <h1 className="text-4xl font-bold mb-2">{title}</h1>
          <p className="text-gray-400">Find answers to common questions about {title.toLowerCase()}</p>
        </section>

        {/* FAQ Accordion */}
        <section className="max-w-6xl mx-auto p-6">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {articles.map((article, i) => (
              <div key={i} className="border border-gray-700 rounded bg-gray-800">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-750 transition-colors"
                >
                  <span className="font-semibold text-lg">{article.question}</span>
                  {openIndex === i ? (
                    <FiChevronUp className="text-bf-green flex-shrink-0 ml-4" />
                  ) : (
                    <FiChevronDown className="text-gray-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                {openIndex === i && (
                  <div className="p-4 pt-0 text-gray-300 border-t border-gray-700">
                    <p className="mt-2">{article.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {articles.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-xl mb-4">No articles found for this category.</p>
              <Link to="/support" className="text-bf-green hover:underline">
                Return to Support Home
              </Link>
            </div>
          )}
        </section>

        {/* Contact Support CTA */}
        <section className="max-w-6xl mx-auto p-6 my-8">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Still need help?</h2>
            <p className="text-gray-400 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link to="/contact">
              <button className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors">
                Contact Support
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
