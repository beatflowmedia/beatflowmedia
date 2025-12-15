import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Footer from "../components/Footer";

export default function VendorApplication() {
  const [formData, setFormData] = useState({
    partnershipType: "",
    companyName: "",
    website: "",
    contactName: "",
    email: "",
    phone: "",
    jobTitle: "",
    companySize: "",
    revenue: "",
    description: "",
    targetMarkets: [],
    timeline: "",
    experience: "",
    references: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        targetMarkets: checked
          ? [...prev.targetMarkets, value]
          : prev.targetMarkets.filter(m => m !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, "vendorApplications"), {
        ...formData,
        submittedAt: new Date(),
        status: "pending",
      });

      console.log("Vendor application submitted with ID:", docRef.id);
      alert("Thank you for your application! Our partnerships team will review your submission and contact you within 5-7 business days.");

      // Reset form
      setFormData({
        partnershipType: "",
        companyName: "",
        website: "",
        contactName: "",
        email: "",
        phone: "",
        jobTitle: "",
        companySize: "",
        revenue: "",
        description: "",
        targetMarkets: [],
        timeline: "",
        experience: "",
        references: "",
      });
    } catch (error) {
      console.error("Error submitting vendor application:", error);
      alert("There was an error submitting your application. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <Link to="/vendors" className="text-bf-green hover:underline mb-4 inline-flex items-center">
            <FiArrowLeft className="mr-2" />
            Back to Vendor Partnerships
          </Link>
          <h1 className="text-5xl font-bold mb-4">Vendor Partnership Application</h1>
          <p className="text-xl text-gray-400 mb-12">
            Tell us about your company and how you'd like to partner with BeatFlow Media
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Partnership Information */}
            <div className="bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Partnership Information</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Partnership Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="partnershipType"
                  value={formData.partnershipType}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                >
                  <option value="">Select partnership type</option>
                  <option value="hardware">Hardware Partners</option>
                  <option value="automotive">Automotive Partners</option>
                  <option value="mobile-carrier">Mobile Carriers</option>
                  <option value="retail">Retail Partners</option>
                  <option value="business-solutions">Business Solutions</option>
                  <option value="technology">Technology Partners</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Target Markets (Select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa"].map((market) => (
                    <label key={market} className="flex items-center">
                      <input
                        type="checkbox"
                        name="targetMarkets"
                        value={market}
                        checked={formData.targetMarkets.includes(market)}
                        onChange={handleChange}
                        className="mr-2 w-4 h-4"
                      />
                      <span className="text-gray-300 text-sm">{market}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Expected Launch Timeline</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate (1-3 months)</option>
                  <option value="short-term">Short-term (3-6 months)</option>
                  <option value="medium-term">Medium-term (6-12 months)</option>
                  <option value="long-term">Long-term (12+ months)</option>
                  <option value="exploratory">Exploratory</option>
                </select>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-gray-800 rounded-lg p-8">
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
                  <label className="block text-sm font-semibold mb-2">
                    Website <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    required
                    placeholder="https://"
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Company Size</label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Annual Revenue (Optional)</label>
                  <select
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleChange}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  >
                    <option value="">Select revenue range</option>
                    <option value="under-1m">Under $1M</option>
                    <option value="1m-10m">$1M - $10M</option>
                    <option value="10m-50m">$10M - $50M</option>
                    <option value="50m-100m">$50M - $100M</option>
                    <option value="100m-500m">$100M - $500M</option>
                    <option value="500m+">$500M+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Primary Contact</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Full Name <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-semibold mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
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
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Partnership Details */}
            <div className="bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Partnership Details</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Partnership Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Describe your company, your proposed partnership, and how it would benefit BeatFlow Media users..."
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Relevant Experience</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows="4"
                  placeholder="List any relevant partnerships, integrations, or experience with similar platforms..."
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">References (Optional)</label>
                <textarea
                  name="references"
                  value={formData.references}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Provide references from other partnerships or clients..."
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-bf-green focus:outline-none"
                />
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-800 rounded-lg p-8 border border-bf-green">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FiCheckCircle className="text-bf-green mr-2" />
                What Happens Next
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">1.</span>
                  Our partnerships team will review your application within 5-7 business days
                </li>
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">2.</span>
                  If there's a potential fit, we'll schedule an initial consultation call
                </li>
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">3.</span>
                  We'll discuss partnership terms, technical requirements, and timelines
                </li>
                <li className="flex items-start">
                  <span className="text-bf-green mr-3 font-bold">4.</span>
                  Once aligned, we'll begin the onboarding and integration process
                </li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex justify-center space-x-4 pb-12">
              <button
                type="submit"
                className="bg-green-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition"
              >
                Submit Application
              </button>
              <Link to="/vendors">
                <button
                  type="button"
                  className="border border-gray-600 text-white px-10 py-4 rounded-full font-semibold hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
