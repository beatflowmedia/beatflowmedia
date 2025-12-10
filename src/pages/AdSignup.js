import React from "react";
import { Link } from "react-router-dom";

export default function AdSignup() {
  // Form state
  const [formData, setFormData] = React.useState({
    businessType: "",
    businessName: "",
    businessEmail: "",
    businessWebsite: "",
    country: "",
    receiveNews: false,
    agreeTerms: false
  });
  const COUNTRIES = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Brazil",
    "India",
    "Japan",
  ];
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      alert("You must agree to the terms and conditions.");
      return;
    }
    console.log("Submitting sign-up:", formData);
    alert("Thanks! Your info has been submitted.");
    // reset
    setFormData({
      businessType: "",
      businessName: "",
      businessEmail: "",
      businessWebsite: "",
      country: "",
      receiveNews: false,
      agreeTerms: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20">
      <div className="max-w-md mx-auto">
        <Link
          to="/advertising"
          className="text-bf-green hover:underline mb-4 inline-block"
        >
           Back to Advertising
        </Link>
        <h1 className="text-3xl font-bold mb-6">Create an Ad</h1>
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              required
              className="bg-gray-700 p-3 rounded w-full"
            >
              <option value="">Business type</option>
              <option>Brand</option>
              <option>Agency</option>
              <option>Small Business</option>
              <option>Other</option>
            </select>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              type="text"
              placeholder="Business name"
              required
              className="w-full bg-gray-700 p-3 rounded"
            />
          </div>
          <input
            name="businessEmail"
            value={formData.businessEmail}
            onChange={handleChange}
            type="email"
            placeholder="Email Address"
            required
            className="w-full bg-gray-700 p-3 rounded"
          />
          <input
            name="businessWebsite"
            value={formData.businessWebsite}
            onChange={handleChange}
            type="url"
            placeholder="Website (Optional)"
            className="w-full bg-gray-700 p-3 rounded"
          />
          <input
            name="country"
            list="countries"
            value={formData.country}
            onChange={handleChange}
            placeholder="Country or region"
            required
            className="w-full bg-gray-700 p-3 rounded"
          />
          <datalist id="countries">
            {COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="flex items-center space-x-2">
            <input
              id="receiveNews"
              name="receiveNews"
              type="checkbox"
              checked={formData.receiveNews}
              onChange={handleChange}
              className="bg-gray-700 rounded text-bf-green"
            />
            <label htmlFor="receiveNews">
              I want to receive news and promotions from BeatFlow Ads Manager
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="agreeTerms"
              name="agreeTerms"
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={handleChange}
              required
              className="bg-gray-700 rounded text-bf-green"
            />
            <label htmlFor="agreeTerms" className="text-gray-300">
              I agree to the{" "}
              <a
                href="/terms"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Master Advertising Terms & Conditions
              </a>
            </label>
          </div>
          <button
            type="submit"
            className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold"
          >
            Finish
          </button>
        </form>
      </div>
    </div>
  );
}
