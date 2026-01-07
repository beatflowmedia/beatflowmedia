import React, { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useModal } from "../hooks/useModal";

export default function SyncLicensing() {
  const { showAlert } = useModal();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      await showAlert('Info', 'Please fill in all required fields', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "syncLicensingInquiries"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "new"
      });
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        projectType: "",
        message: ""
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      await showAlert('Error', 'Failed to submit inquiry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-600 to-blue-600 rounded-full">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold mb-4">Sync Licensing</h1>
          <p className="text-2xl text-gray-400 mb-8">Coming Soon</p>

          {/* Description */}
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-lg text-gray-300 mb-6">
              We're building a comprehensive sync licensing platform for music supervisors,
              filmmakers, and content creators to easily license music for their projects.
            </p>
            <p className="text-gray-400 mb-6">
              Our sync licensing system will include:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold text-green-500 mb-2"> Quick Licensing</h3>
                <p className="text-sm text-gray-400">
                  Instant quotes and streamlined licensing process
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold text-green-500 mb-2"> Custom Rates</h3>
                <p className="text-sm text-gray-400">
                  Flexible pricing based on project type and usage
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold text-green-500 mb-2"> Rights Clearance</h3>
                <p className="text-sm text-gray-400">
                  Complete master and publishing rights included
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold text-green-500 mb-2"> Project Management</h3>
                <p className="text-sm text-gray-400">
                  Track all your licenses and downloads in one place
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">Get Early Access</h2>
            <p className="text-white mb-6">
              Be the first to know when sync licensing launches. Sign up for updates.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/contact"
                className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                to="/browse"
                className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
              >
                Browse Music
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto text-left">
            <h2 className="text-2xl font-bold mb-4 text-center">Request Information</h2>
            <p className="text-gray-400 mb-6 text-center">
              Interested in sync licensing? Fill out the form below and we'll get back to you soon.
            </p>

            {submitted && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
                <p className="text-green-500 font-semibold">✓ Thank you for your inquiry!</p>
                <p className="text-gray-300 text-sm mt-1">
                  We've received your message and will contact you within 24-48 hours.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold mb-2">
                  Company / Organization
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                  placeholder="Company name (optional)"
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-semibold mb-2">
                  Project Type
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select a project type</option>
                  <option value="film">Film</option>
                  <option value="tv">Television</option>
                  <option value="commercial">Commercial / Advertisement</option>
                  <option value="video-game">Video Game</option>
                  <option value="podcast">Podcast</option>
                  <option value="youtube">YouTube / Social Media</option>
                  <option value="corporate">Corporate Video</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                  placeholder="Tell us about your project and licensing needs..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-full font-semibold transition-colors ${
                  submitting
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>

            <p className="text-gray-500 text-xs text-center mt-4">
              Or email us directly at{" "}
              <a
                href="mailto:licensing@beatflowmediagroup.com"
                className="text-green-500 hover:underline"
              >
                licensing@beatflowmediagroup.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
