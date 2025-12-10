import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";

export default function AdSignup() {
  const [formData, setFormData] = useState({
    businessType: "",
    objective: "",
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    website: "",
    country: "United States",
    state: "",
    estimatedBudget: "",
    newsletter: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Ad signup form submitted:", formData);
    alert("Thank you for your interest! Our team will contact you within 24 hours.");
  };

  const features = [
    "Self-serve ad creation with guided workflows",
    "Real-time campaign analytics and reporting",
    "Advanced audience targeting options",
    "Multiple ad formats: audio, video, display",
    "Flexible budget controls and bidding strategies",
    "Dedicated account support for larger budgets",
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            ê Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">Create Your BeatFlow Ad Campaign</h1>
          <p className="text-gray-400 text-lg">
            Reach millions of engaged listeners with BeatFlow Advertising. Get started in minutes.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Benefits */}
          <div>
            <h2 className="text-3xl font-bold mb-6">What You Get with BeatFlow Ads</h2>
            <ul className="space-y-4 mb-8">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <FiCheck className="text-bf-green text-2xl mr-3 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Budget Flexibility</h3>
              <p className="text-gray-300 mb-4">
                Start with as little as $250 and scale as you see results. No long-term contracts required.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Quick Launch</h3>
              <p className="text-gray-300">
                Most campaigns go live within 24-48 hours of approval. Our review team works quickly to get you results fast.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-gray-800 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Tell Us About Your Business</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                  className="bg-gray-700 p-3 rounded w-full text-white"
                >
                  <option value="">I am a...</option>
                  <option value="brand">Brand/Business</option>
                  <option value="agency">Agency/Partner</option>
                  <option value="individual">Individual/Creator</option>
                </select>
                <select
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  required
                  className="bg-gray-700 p-3 rounded w-full text-white"
                >
                  <option value="">My goal is...</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="consideration">Consideration/Engagement</option>
                  <option value="conversion">Drive Sales/Conversions</option>
                  <option value="app">App Installs</option>
                  <option value="traffic">Website Traffic</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name *"
                  required
                  className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name *"
                  required
                  className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400"
                />
              </div>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Work Email Address *"
                required
                className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400"
              />

              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company Name *"
                required
                className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400"
              />

              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Website URL"
                className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="bg-gray-700 p-3 rounded w-full text-white"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                  className="w-full bg-gray-700 p-3 rounded text-white placeholder-gray-400"
                />
              </div>

              <select
                name="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded w-full text-white"
              >
                <option value="">Estimated Monthly Budget</option>
                <option value="250-1000">$250 - $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000-10000">$5,000 - $10,000</option>
                <option value="10000-25000">$10,000 - $25,000</option>
                <option value="25000+">$25,000+</option>
              </select>

              <div className="flex items-start space-x-3">
                <input
                  id="newsletter"
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="mt-1 bg-gray-700 rounded text-bf-green"
                />
                <label htmlFor="newsletter" className="text-gray-300 text-sm">
                  Sign up for our newsletter to receive advertising tips, case studies, and platform updates
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-bf-green text-black px-6 py-4 rounded-full font-semibold text-lg hover:bg-green-400 transition"
              >
                Get Started
              </button>

              <p className="text-gray-400 text-xs text-center">
                By submitting this form, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Trusted by Leading Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-50">
            {["Nike", "Coca-Cola", "Amazon", "Tesla", "Apple", "Samsung", "McDonald's", "Microsoft"].map((brand, idx) => (
              <div key={idx} className="text-center text-2xl font-bold text-gray-600">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Common Questions</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="font-bold mb-2">How long does it take to launch a campaign?</h3>
              <p className="text-gray-400">Most campaigns are reviewed and approved within 24-48 hours.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="font-bold mb-2">What's the minimum budget?</h3>
              <p className="text-gray-400">You can start with as little as $250 for your first campaign.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="font-bold mb-2">Can I pause or stop a campaign anytime?</h3>
              <p className="text-gray-400">Yes, you have full control to pause, edit, or stop campaigns at any time.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/resources/help-center" className="text-bf-green hover:underline">
              View all FAQs í
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
