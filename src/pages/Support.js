import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";
import { FiChevronDown, FiChevronUp, FiChevronRight } from "react-icons/fi";

export default function Support() {
  const { region = "us" } = useParams();
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const categories = [
    { label: "Payments & Billing", slug: "payments-and-billing" },
    { label: "Manage Your Account", slug: "manage-your-account" },
    { label: "Premium Plans", slug: "premium-plans" },
    { label: "In-App Features", slug: "in-app-features" },
    { label: "Devices & Troubleshooting", slug: "devices-and-troubleshooting" },
    { label: "Safety & Privacy", slug: "safety-and-privacy" },
  ];

  const quickLinks = [
    { label: "Login Failure", path: "/help/login-failure" },
    { label: "Payment Error", path: "/help/payment-error" },
    { label: "Over Charges", path: "/help/over-charges" },
    { label: "Family Plan Management", path: "/help/family-plan" },
    { label: "Update Payment Details", path: "/help/update-payment" },
  ];

  const resources = [
    { label: "About Us", path: "/about" },
    { label: "Jobs", path: "/jobs" },
    { label: "Newsroom", path: "/news" },
    { label: "Artists", path: "/for-artists" },
    { label: "Developers", path: "/developers" },
    { label: "Advertisers", path: "/advertising" },
    { label: "Investors", path: "/investors" },
    { label: "Vendors", path: "/vendors" },
  ];

  const toolsAndPlans = [
    { label: "Web Player", path: "/web-player" },
    { label: "Mobile Apps", path: "/mobile-app" },
    { label: "Contact Support", path: "/contact" },
    { label: "Free Plan", path: "/plans/free" },
    { label: "Premium Plans", path: "/plans/premium" },
  ];

  const legalAndPrivacy = [
    { label: "Terms of Service", path: "/legal" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Cookies", path: "/cookies" },
    { label: "Accessibility", path: "/accessibility" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bf-page">
      {/* Main navigation */}
      <NavBar />
      <main className="flex-1 bg-bf-page text-white">
        {/* offset for fixed navbar */}
        <div className="pt-16" />
        {/* Hero banner */}
        <section className="bg-gradient-to-b from-bf-green to-bf-page p-12 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <input
            type="search"
            placeholder="Search help topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mx-auto w-full max-w-lg p-4 rounded shadow-lg border-0"
          />
        </section>

        {/* Categories Accordion */}
        <section className="mb-8 max-w-6xl mx-auto p-6">
          <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c, i) => (
              <div key={c.slug} className="border border-gray-700 rounded">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex justify-between items-center p-4 text-left"
                >
                  <span>{c.label}</span>
                  {openIndex === i ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {openIndex === i && (
                  <div className="p-4 bg-gray-800">
                    <Link
                      to={`/support/${region}/category/${c.slug}`}
                      className="text-bf-green"
                    >
                      Go to {c.label}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Help */}
        <section className="mb-8 max-w-6xl mx-auto p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-white">Quick Help</h2>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li
                key={link.label}
                className="flex justify-between items-center"
              >
                <Link
                  to={link.path}
                  className="text-gray-300 hover:text-bf-green"
                >
                  {link.label}
                </Link>
                <FiChevronRight className="text-gray-500" />
              </li>
            ))}
          </ul>
        </section>

        {/* Community CTA */}
        <section className="bg-gray-900 p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2 text-white">
            Visit our Community
          </h2>
          <p className="text-gray-400 mb-4">
            Have questions? Find answers from our peer-to-peer support
            community.
          </p>
          <a
            href="https://community.beatflowmediagroup.com"
            className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold inline-block"
          >
            Go to Community
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
