import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function CreativeQuote() {
  const [formData, setFormData] = useState({
    serviceType: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    projectDescription: "",
    targetAudience: "",
    budget: "",
    timeline: "",
    hasExistingBrand: "yes",
    additionalServices: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        additionalServices: checked
          ? [...prev.additionalServices, value]
          : prev.additionalServices.filter(s => s !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, "creativeQuotes"), {
        ...formData,
        submittedAt: new Date(),
        status: "pending",
      });

      console.log("Quote request submitted with ID:", docRef.id);
      alert("Thank you! We'll review your request and get back to you within 1 business day.");

      // Reset form
      setFormData({
        serviceType: "",
        companyName: "",
        website: "",
        contactName: "",
        email: "",
        phone: "",
        projectDescription: "",
        targetAudience: "",
        budget: "",
        timeline: "",
        hasExistingBrand: "yes",
        additionalServices: [],
      });
    } catch (error) {
      console.error("Error submitting quote request:", error);
      alert("There was an error submitting your request. Please try again.");
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-bf-green to-green-700 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/creative-lab" className="text-black hover:underline mb-4 inline-flex items-center">
            <FiArrowLeft className="mr-2" />
            Back to Creative Lab
          </Link>
          <h1 className="text-5xl font-bold mb-4 text-black">Request a Quote</h1>
          <p className="text-black text-lg max-w-3xl">
            Tell us about your project and we'll provide a custom quote within 1 business day.
          </p>
        </div>
      </header>

      {/* Form */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Selection */}
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Service Information</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  What service are you interested in? <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                >
                  <option value="">Select a service</option>
                  <option value="audio-production">Audio Production</option>
                  <option value="video-production">Video Production</option>
                  <option value="creative-strategy">Creative Strategy</option>
                  <option value="creative-review">Creative Review & Optimization</option>
                  <option value="full-campaign">Full Campaign Package</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Project Budget Range</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                >
                  <option value="">Select budget range</option>
                  <option value="under-5k">Under $5,000</option>
                  <option value="5k-10k">$5,000 - $10,000</option>
                  <option value="10k-25k">$10,000 - $25,000</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k-plus">$50,000+</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Desired Timeline</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">ASAP (Rush)</option>
                  <option value="1-2-weeks">1-2 weeks</option>
                  <option value="2-4-weeks">2-4 weeks</option>
                  <option value="1-2-months">1-2 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Additional Services (Optional)</label>
                <div className="space-y-2">
                  {[
                    { value: "translation", label: "Multi-language translation" },
                    { value: "voiceover", label: "Professional voiceover" },
                    { value: "music", label: "Custom music composition" },
                    { value: "animation", label: "Motion graphics/animation" },
                    { value: "testing", label: "A/B testing support" },
                  ].map((service) => (
                    <label key={service.value} className="flex items-center">
                      <input
                        type="checkbox"
                        name="additionalServices"
                        value={service.value}
                        checked={formData.additionalServices.includes(service.value)}
                        onChange={handleChange}
                        className="mr-3 w-4 h-4"
                      />
                      <span className="text-gray-300">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Company Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://"
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Project Details</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Tell us about your campaign goals, key messages, and creative vision..."
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Target Audience</label>
                <textarea
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe your target audience (demographics, interests, behaviors)..."
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Do you have existing brand guidelines?</label>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasExistingBrand"
                      value="yes"
                      checked={formData.hasExistingBrand === "yes"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasExistingBrand"
                      value="no"
                      checked={formData.hasExistingBrand === "no"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasExistingBrand"
                      value="partial"
                      checked={formData.hasExistingBrand === "partial"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Partial</span>
                  </label>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-gray-800 p-8 rounded-lg border border-bf-green">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FiCheckCircle className="text-bf-green mr-2" />
                What Happens Next
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">1.</span>
                  We'll review your request within 1 business day
                </li>
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">2.</span>
                  A Creative Lab specialist will reach out to discuss your needs
                </li>
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">3.</span>
                  You'll receive a detailed quote and project timeline
                </li>
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">4.</span>
                  Once approved, we'll kick off with a strategy session
                </li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex justify-center space-x-4">
              <button
                type="submit"
                className="bg-bf-green text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-green-400 transition"
              >
                Submit Quote Request
              </button>
              <Link to="/creative-lab">
                <button
                  type="button"
                  className="border border-gray-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">How long does it take to receive a quote?</h3>
              <p className="text-gray-400">We typically respond within 1 business day with an initial quote. More complex projects may require a brief consultation call before finalizing the quote.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">What information do I need to provide?</h3>
              <p className="text-gray-400">The more details you provide about your project goals, target audience, and creative vision, the more accurate our quote will be. Brand guidelines, reference materials, and examples are always helpful.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Can I request revisions?</h3>
              <p className="text-gray-400">Yes! All packages include rounds of revisions at key milestones. Additional revisions beyond the included rounds can be quoted separately.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Do you work with agencies or only direct brands?</h3>
              <p className="text-gray-400">We work with both! Whether you're a brand, agency, or media buyer, we're happy to support your creative needs.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
