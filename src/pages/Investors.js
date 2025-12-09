import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import Footer from "../components/Footer";

export default function Investors() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !consent) return;
    try {
      await addDoc(collection(db, "investorRequests"), {
        email,
        consent: true,
        consentTs: serverTimestamp()
      });
      setAccessGranted(true);
    } catch (err) {
      console.error("Failed to record consent:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-16 px-6 pb-16 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto">
          {!accessGranted ? (
            // Public teaser & email capture
            <section className="text-center py-16">
              <h1 className="text-4xl font-bold mb-4">Investors</h1>
              <p className="mt-4 text-gray-400 text-lg mb-6">
                Seeking $1M seed to scale our hybrid artist–curator growth
                engine. Targeting $3.8M revenue in Year 1, 5× return at $25–50M
                exit.
              </p>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-center space-y-4"
              >
                <input
                  type="email"
                  placeholder="Your business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full max-w-sm bg-gray-800 p-3 rounded text-white"
                />
                <div className="flex items-center space-x-2">
                  <input
                    id="nda"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-4 h-4 text-bf-green bg-gray-800 rounded"
                  />
                  <label htmlFor="nda" className="text-gray-300">
                    I agree to the{" "}
                    <a
                      href="/nda"
                      target="_blank"
                      className="underline text-bf-green"
                    >
                      NDA terms
                    </a>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!consent}
                  className={`px-6 py-3 rounded-full font-semibold ${consent ? "bg-bf-green text-black hover:bg-green-600" : "bg-gray-600 text-gray-400 cursor-not-allowed"}`}
                >
                  Request Access
                </button>
              </form>
            </section>
          ) : (
            // Gated investor content
            <>
              {/* Executive Summary & Deck download link */}
              <section className="py-8">
                <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
                <p className="text-gray-400 mb-4">
                  Download our full investor deck and NDA to access detailed
                  metrics.
                </p>
                <Link
                  to="/investors/deck.pdf"
                  className="text-bf-green hover:underline"
                >
                  Download Deck (PDF)
                </Link>
              </section>
              {/* Detailed sections: Mission, Market Opportunity, Traction, Financials... */}
              {/* ...existing detailed IR content goes here... */}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
