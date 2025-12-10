import React from "react";
import Footer from "../components/Footer";

export default function Student() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Premium Student</h1>
          <p className="text-xl text-gray-400 mb-12">
            Special discount for verified students at accredited institutions
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-8 mb-12">
            <div className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full inline-block mb-4 font-semibold text-sm">
              50% OFF
            </div>
            <h2 className="text-3xl font-bold mb-4">1 Student Account</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$5.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4">
              Get Premium Student
            </button>
            <p className="text-sm text-center text-gray-200">
              Free for 1 month. Offer available only to students at accredited institutions.
            </p>
          </div>

          {/* Eligibility */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">🎓 Student Verification Required</h3>
            <p className="text-gray-300 mb-4">
              To get Premium Student, you must be enrolled at an accredited higher education institution.
              We verify your student status through SheerID, a third-party verification service.
            </p>
            <p className="text-gray-400 text-sm">
              Verification is required every 12 months to continue receiving the student discount.
            </p>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">Everything in Premium Individual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎵</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ad-free music listening</h3>
                <p className="text-gray-400">
                  Enjoy uninterrupted music without any advertisements.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📥</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Offline playback</h3>
                <p className="text-gray-400">
                  Download up to 10,000 songs on 5 different devices.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">⏭️</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Unlimited skips</h3>
                <p className="text-gray-400">
                  Skip songs as many times as you want without limits.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎧</div>
              <div>
                <h3 className="text-xl font-bold mb-2">High audio quality</h3>
                <p className="text-gray-400">
                  Stream music in high-quality 320kbps audio.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Play on any device</h3>
                <p className="text-gray-400">
                  Listen on phone, computer, tablet, speakers, TV, and more.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Special student pricing</h3>
                <p className="text-gray-400">
                  Save 50% with verified student discount - just $5.99/month.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <h2 className="text-3xl font-bold mb-6 text-center">How to sign up</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { step: "1", title: "Click Get Started", description: "Begin the signup process" },
              { step: "2", title: "Verify Status", description: "Prove you're a student with SheerID" },
              { step: "3", title: "Create Account", description: "Sign up for BeatFlow Media" },
              { step: "4", title: "Start Listening", description: "Enjoy Premium Student benefits" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "Who is eligible for Premium Student?",
                answer: "Students enrolled at accredited higher education institutions (colleges, universities) are eligible. You must be able to verify your enrollment through SheerID."
              },
              {
                question: "How long does the student discount last?",
                answer: "The discount lasts for up to 4 years total, but you must re-verify your student status every 12 months to continue receiving the discount."
              },
              {
                question: "What happens after I graduate?",
                answer: "After graduation or after 4 years, you'll need to switch to a regular Premium Individual plan at $10.99/month to keep your Premium benefits."
              },
              {
                question: "Can I switch to Premium Student if I already have Premium?",
                answer: "Yes! If you're currently a Premium Individual subscriber and become a verified student, you can switch to Premium Student to save 50%."
              },
              {
                question: "What information is needed for verification?",
                answer: "You'll need to provide your name, date of birth, and information about your educational institution. SheerID handles the verification process securely."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center bg-gray-800 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to save 50%?</h2>
            <p className="text-gray-400 mb-6">
              Verify your student status and get 1 month of Premium Student for free.
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
              Verify Student Status
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
