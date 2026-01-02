import { useState } from "react";
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
    if (!email.trim() || !consent) {
      console.log("Form validation failed");
      return;
    }

    console.log("Submitting investor request for:", email);
    try {
      await addDoc(collection(db, "investorRequests"), {
        email,
        consent: true,
        consentTs: serverTimestamp()
      });
      console.log("✅ Investor request submitted successfully");
      setAccessGranted(true);
    } catch (err) {
      console.error("Failed to record consent:", err);
      alert("Failed to submit request. Please try again.");
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
            // Request submitted - show confirmation
            <section className="text-center py-16">
              <div className="max-w-2xl mx-auto">
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-8 mb-6">
                  <h2 className="text-3xl font-bold text-green-400 mb-4">
                    ✓ Request Submitted
                  </h2>
                  <p className="text-gray-300 text-lg mb-4">
                    Thank you for your interest in BeatFlow Media!
                  </p>
                  <p className="text-gray-400">
                    We've sent detailed information about our investment opportunity to <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 text-left">
                  <h3 className="text-xl font-bold mb-4">What's Next?</h3>
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-start">
                      <span className="text-bf-green mr-2">•</span>
                      <span>Check your email for the investor deck summary and key metrics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-bf-green mr-2">•</span>
                      <span>Reply to request the full pitch deck, financial projections, and cap table</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-bf-green mr-2">•</span>
                      <span>Schedule a call to discuss the opportunity in detail</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-bf-green mr-2">•</span>
                      <span>Review the <Link to="/nda" className="text-bf-green hover:underline">NDA terms</Link> you've agreed to</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <p className="text-gray-400 mb-4">
                    Have questions? Contact us directly:
                  </p>
                  <a
                    href="mailto:office@beatflowmediagroup.com"
                    className="inline-block bg-bf-green text-black font-semibold px-6 py-3 rounded-full hover:bg-green-600 transition"
                  >
                    Email Us
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
