import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function CookieSettings() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always enabled
    performance: true,
    functional: true,
    advertising: false,
    socialMedia: false
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    if (key === 'essential') return; // Can't disable essential cookies

    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      performance: true,
      functional: true,
      advertising: true,
      socialMedia: true
    });
    handleSave();
  };

  const handleRejectAll = () => {
    setPreferences({
      essential: true, // Always required
      performance: false,
      functional: false,
      advertising: false,
      socialMedia: false
    });
    handleSave();
  };

  const handleSave = () => {
    // TODO: Save preferences to localStorage and update cookie consent
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/cookies" className="text-green-500 hover:underline mb-4 inline-block">
              ← Back to Cookie Policy
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Cookie Settings</h1>
          <p className="text-xl text-gray-400 mb-12">
            Manage your cookie preferences and control how we use cookies on BeatFlow Media
          </p>

          {/* Save Success Message */}
          {saved && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-8">
              <p className="text-green-500 font-semibold">✓ Cookie preferences saved successfully</p>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-2">About Cookie Preferences</h3>
            <p className="text-gray-300">
              We use cookies and similar technologies to provide, protect, and improve our Service.
              You can control which types of cookies you allow below. Note that blocking some types
              of cookies may impact your experience on BeatFlow Media.
            </p>
          </div>

          {/* Essential Cookies */}
          <section className="mb-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">Essential Cookies</h3>
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Required</span>
                  </div>
                  <p className="text-gray-400 mb-3">
                    These cookies are necessary for the Service to function properly. They enable core
                    functionality such as security, authentication, and account management.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="font-semibold mb-1">Examples:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Session cookies to keep you logged in</li>
                      <li>Security cookies to prevent fraud and abuse</li>
                      <li>Load balancing cookies for performance</li>
                    </ul>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 opacity-50 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Always On</p>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Cookies */}
          <section className="mb-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Performance Cookies</h3>
                  <p className="text-gray-400 mb-3">
                    These cookies help us understand how users interact with our Service by collecting and
                    analyzing information about usage patterns, errors, and performance.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="font-semibold mb-1">Examples:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Google Analytics for traffic analysis</li>
                      <li>Error tracking and crash reporting</li>
                      <li>Page load time measurement</li>
                      <li>Feature usage statistics</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle("performance")}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.performance ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.performance ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Functional Cookies */}
          <section className="mb-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Functional Cookies</h3>
                  <p className="text-gray-400 mb-3">
                    These cookies enable enhanced functionality and personalization, such as remembering
                    your preferences, language settings, and playback settings.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="font-semibold mb-1">Examples:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Volume and playback quality preferences</li>
                      <li>Language and region settings</li>
                      <li>Dark/light theme preferences</li>
                      <li>Recently played and queue management</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle("functional")}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.functional ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.functional ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Advertising Cookies */}
          <section className="mb-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Targeting/Advertising Cookies</h3>
                  <p className="text-gray-400 mb-3">
                    These cookies are used to deliver relevant advertisements and measure the effectiveness
                    of advertising campaigns. They track your browsing habits across websites.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="font-semibold mb-1">Examples:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Personalized ad delivery</li>
                      <li>Conversion tracking and attribution</li>
                      <li>Remarketing campaigns</li>
                      <li>Third-party ad network cookies</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle("advertising")}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.advertising ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.advertising ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Social Media Cookies */}
          <section className="mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Social Media Cookies</h3>
                  <p className="text-gray-400 mb-3">
                    These cookies enable social media features such as sharing content and connecting
                    your BeatFlow Media account with social media platforms.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="font-semibold mb-1">Examples:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Facebook, Twitter, Instagram integration</li>
                      <li>Social sharing buttons</li>
                      <li>Social login features</li>
                      <li>Social media feed embeds</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle("socialMedia")}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.socialMedia ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.socialMedia ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-gray-400 text-sm">
                {preferences.essential && preferences.performance && preferences.functional &&
                 preferences.advertising && preferences.socialMedia ? (
                  <span className="text-green-500 font-semibold">All cookies enabled</span>
                ) : preferences.essential && !preferences.performance && !preferences.functional &&
                   !preferences.advertising && !preferences.socialMedia ? (
                  <span className="text-yellow-500 font-semibold">Only essential cookies enabled</span>
                ) : (
                  <span>Custom preferences selected</span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleRejectAll}
                  className="px-6 py-2 rounded-full font-semibold text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 rounded-full font-semibold bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-full font-semibold bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-12">
            <h3 className="text-lg font-bold mb-2">More Information</h3>
            <p className="text-sm text-gray-300 mb-4">
              For more details about how we use cookies and your privacy rights, please review:
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/cookies" className="text-green-500 hover:underline text-sm">
                Cookie Policy
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/privacy-policy" className="text-green-500 hover:underline text-sm">
                Privacy Policy
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/privacy-center" className="text-green-500 hover:underline text-sm">
                Privacy Center
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
