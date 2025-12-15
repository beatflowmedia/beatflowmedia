import { useState } from "react";
import Footer from "../components/Footer";

export default function PrivacyChoices() {
  const [preferences, setPreferences] = useState({
    personalizedAds: true,
    dataSharing: true,
    marketingEmails: true,
    analyticsTracking: true,
    socialMediaSharing: false
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Your Privacy Choices</h1>
          <p className="text-xl text-gray-400 mb-12">
            Control how your personal information is used
          </p>

          {/* California Notice */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-12">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="text-xl font-bold mb-2">California Residents</h3>
                <p className="text-gray-300 mb-3">
                  Under the California Consumer Privacy Act (CCPA), you have specific rights regarding your
                  personal information. Learn more about your rights in our{" "}
                  <a href="/notice-at-collection" className="text-green-500 hover:underline">
                    Notice at Collection
                  </a>.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Privacy Controls</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Personalized Advertising</h3>
                    <p className="text-gray-400 mb-3">
                      Allow us to show you personalized ads based on your listening habits and preferences.
                      Turning this off means you'll still see ads, but they won't be tailored to your interests.
                    </p>
                    <p className="text-sm text-gray-500">
                      This setting controls targeted advertising across BeatFlow Media services.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('personalizedAds')}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      preferences.personalizedAds ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        preferences.personalizedAds ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Data Sharing for Cross-Context Advertising</h3>
                    <p className="text-gray-400 mb-3">
                      Allow us to share your information with partners for advertising purposes across different
                      websites and apps. This is what CCPA refers to as "sharing" personal information.
                    </p>
                    <p className="text-sm text-gray-500">
                      Opting out prevents sharing of your data for behavioral advertising.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('dataSharing')}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      preferences.dataSharing ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        preferences.dataSharing ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Marketing Emails</h3>
                    <p className="text-gray-400 mb-3">
                      Receive promotional emails about new features, special offers, and music recommendations.
                      You'll still receive important account and service updates.
                    </p>
                    <p className="text-sm text-gray-500">
                      You can also unsubscribe from specific email types in your email preferences.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('marketingEmails')}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      preferences.marketingEmails ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        preferences.marketingEmails ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Analytics and Performance Tracking</h3>
                    <p className="text-gray-400 mb-3">
                      Allow us to collect anonymized usage data to improve our service, fix bugs, and
                      understand how users interact with BeatFlow Media.
                    </p>
                    <p className="text-sm text-gray-500">
                      This helps us make BeatFlow Media better for everyone.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('analyticsTracking')}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      preferences.analyticsTracking ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        preferences.analyticsTracking ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Social Media Sharing</h3>
                    <p className="text-gray-400 mb-3">
                      Make it easier to share content to social media platforms. This allows BeatFlow Media
                      to integrate with your social media accounts.
                    </p>
                    <p className="text-sm text-gray-500">
                      You can manage connected accounts in your account settings.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('socialMediaSharing')}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      preferences.socialMediaSharing ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        preferences.socialMediaSharing ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                Save Preferences
              </button>
            </div>
          </div>

          {/* Data Rights */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Your Data Rights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Access Your Data</h3>
                <p className="text-gray-400 mb-4">
                  Request a copy of all the personal information we have about you.
                </p>
                <button className="text-green-500 hover:underline font-semibold">
                  Request Data Download →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Delete Your Data</h3>
                <p className="text-gray-400 mb-4">
                  Request deletion of your personal information, subject to legal exceptions.
                </p>
                <button className="text-green-500 hover:underline font-semibold">
                  Request Deletion →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Correct Your Data</h3>
                <p className="text-gray-400 mb-4">
                  Update or correct inaccurate information in your account.
                </p>
                <button className="text-green-500 hover:underline font-semibold">
                  Update Account Info →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Export Your Data</h3>
                <p className="text-gray-400 mb-4">
                  Export your playlists, listening history, and other data in a portable format.
                </p>
                <button className="text-green-500 hover:underline font-semibold">
                  Export Data →
                </button>
              </div>
            </div>
          </div>

          {/* Cookie Preferences */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Cookie Preferences</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Manage how we use cookies and similar tracking technologies. Learn more in our{" "}
                <a href="/cookies" className="text-green-500 hover:underline">Cookie Policy</a>.
              </p>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-semibold transition-colors">
                Manage Cookie Settings
              </button>
            </div>
          </div>

          {/* Do Not Sell/Share */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Do Not Sell or Share My Personal Information</h2>
            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                California residents can opt out of the "sale" or "sharing" of personal information as
                defined by the CCPA. While we don't sell personal information in the traditional sense,
                we may share data with partners for advertising purposes.
              </p>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                Opt Out of Sale/Sharing
              </button>
            </div>
          </div>

          {/* Third-Party Opt-Outs */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Third-Party Advertising Opt-Outs</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                You can also opt out of targeted advertising through these industry tools:
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-1">Digital Advertising Alliance</h3>
                  <a href="#" className="text-green-500 hover:underline text-sm">
                    youradchoices.com/control
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Network Advertising Initiative</h3>
                  <a href="#" className="text-green-500 hover:underline text-sm">
                    optout.networkadvertising.org
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Google Ad Settings</h3>
                  <a href="#" className="text-green-500 hover:underline text-sm">
                    adssettings.google.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Settings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Mobile Privacy Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">iOS Devices</h3>
                <p className="text-gray-400 mb-3 text-sm">
                  Settings → Privacy & Security → Tracking → Ask App Not to Track
                </p>
                <p className="text-gray-400 text-sm">
                  Settings → Privacy & Security → Apple Advertising → Personalized Ads (toggle off)
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Android Devices</h3>
                <p className="text-gray-400 mb-3 text-sm">
                  Settings → Google → Ads → Opt out of Ads Personalization
                </p>
                <p className="text-gray-400 text-sm">
                  Settings → Privacy → Ads → Delete advertising ID
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Questions about your privacy?</h2>
            <p className="text-gray-300 mb-6">
              If you have questions about these privacy choices or need help exercising your rights,
              please contact our privacy team.
            </p>
            <div className="space-y-2 text-gray-400">
              <p>
                Email:{" "}
                <a href="mailto:privacy@beatflowmedia.com" className="text-green-500 hover:underline">
                  privacy@beatflowmedia.com
                </a>
              </p>
              <p>Phone: 1-800-BEATFLOW</p>
              <p>
                More info:{" "}
                <a href="/privacy-center" className="text-green-500 hover:underline">
                  Privacy Center
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
