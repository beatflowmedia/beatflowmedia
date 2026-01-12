import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function AdPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    personalizedAds: true,
    audioAds: true,
    displayAds: true,
    videoAds: true,
    sponsoredContent: true,
    thirdPartyData: true,
    demographicTargeting: true,
    behavioralTargeting: true,
    contextualTargeting: true
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load preferences from Firebase on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().adPreferences) {
          setPreferences(userDoc.data().adPreferences);
        }
      } catch (err) {
        console.error('Error loading ad preferences:', err);
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDisableAll = () => {
    setPreferences({
      personalizedAds: false,
      audioAds: true, // Can't disable on free tier
      displayAds: true, // Can't disable on free tier
      videoAds: true, // Can't disable on free tier
      sponsoredContent: true, // Can't disable on free tier
      thirdPartyData: false,
      demographicTargeting: false,
      behavioralTargeting: false,
      contextualTargeting: false
    });
    handleSave();
  };

  const handleEnableAll = () => {
    setPreferences({
      personalizedAds: true,
      audioAds: true,
      displayAds: true,
      videoAds: true,
      sponsoredContent: true,
      thirdPartyData: true,
      demographicTargeting: true,
      behavioralTargeting: true,
      contextualTargeting: true
    });
    handleSave();
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setError(null);
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Update existing user document
        await updateDoc(userRef, {
          adPreferences: preferences,
          adPreferencesUpdatedAt: new Date().toISOString()
        });
      } else {
        // Create new user document
        await setDoc(userRef, {
          adPreferences: preferences,
          adPreferencesUpdatedAt: new Date().toISOString()
        });
      }

      // Also save to localStorage as backup
      localStorage.setItem('adPreferences', JSON.stringify(preferences));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving ad preferences:', err);
      setError('Failed to save preferences. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 pt-16 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-400 mb-8">
              Please sign in to manage your ad preferences.
            </p>
            <Link
              to="/"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 pt-16 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your preferences...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/about-ads" className="text-green-500 hover:underline mb-4 inline-block">
              ← Back to About Ads
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Ad Preferences</h1>
          <p className="text-xl text-gray-400 mb-12">
            Control how we use your information for advertising purposes
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
              <p className="text-red-500 font-semibold">✕ {error}</p>
            </div>
          )}

          {/* Save Success Message */}
          {saved && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-8">
              <p className="text-green-500 font-semibold">✓ Ad preferences saved successfully</p>
            </div>
          )}

          {/* Premium Upgrade Banner */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">Go Ad-Free with Premium</h3>
                <p className="text-gray-100">
                  Remove all ads and enjoy unlimited, uninterrupted music
                </p>
              </div>
              <Link
                to="/explore-premium"
                className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* Main Ad Control */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Personalized Advertising</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Enable Personalized Ads</h3>
                  <p className="text-gray-400 mb-3">
                    Allow us to show you ads based on your listening history, preferences, and behavior.
                    Personalized ads are more relevant to your interests.
                  </p>
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-sm">
                    <p className="text-gray-300">
                      <strong>Note:</strong> Disabling personalized ads won't reduce the number of ads you see.
                      You'll still see the same amount of advertising, but it won't be tailored to your interests.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle("personalizedAds")}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.personalizedAds ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.personalizedAds ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Ad Types */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Ad Types</h2>
            <p className="text-gray-400 mb-6">
              Control which types of ads you see. Note that free users will still see ads to support artists
              and the platform.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6 opacity-60">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Audio Ads</h3>
                      <span className="bg-yellow-600 text-xs px-2 py-1 rounded">Free Tier Required</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Audio advertisements that play between songs
                    </p>
                  </div>
                  <div className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 opacity-50 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 opacity-60">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Display Ads</h3>
                      <span className="bg-yellow-600 text-xs px-2 py-1 rounded">Free Tier Required</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Visual advertisements within the BeatFlow Media interface
                    </p>
                  </div>
                  <div className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 opacity-50 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 opacity-60">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Video Ads</h3>
                      <span className="bg-yellow-600 text-xs px-2 py-1 rounded">Free Tier Required</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Video advertisements on video content and mobile app
                    </p>
                  </div>
                  <div className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 opacity-50 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 opacity-60">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Sponsored Content</h3>
                      <span className="bg-yellow-600 text-xs px-2 py-1 rounded">Free Tier Required</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Promoted playlists, albums, and artists in your recommendations
                    </p>
                  </div>
                  <div className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 opacity-50 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Data Usage for Advertising</h2>
            <p className="text-gray-400 mb-6">
              Control how we use your data to personalize ads
            </p>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Third-Party Data Sharing</h3>
                    <p className="text-gray-400 text-sm">
                      Allow sharing anonymized data with advertising partners for better ad targeting
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("thirdPartyData")}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.thirdPartyData ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.thirdPartyData ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Demographic Targeting</h3>
                    <p className="text-gray-400 text-sm">
                      Use your age, gender, and location for ad personalization
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("demographicTargeting")}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.demographicTargeting ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.demographicTargeting ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Behavioral Targeting</h3>
                    <p className="text-gray-400 text-sm">
                      Use your listening history and app behavior for ad personalization
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("behavioralTargeting")}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.behavioralTargeting ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.behavioralTargeting ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Contextual Targeting</h3>
                    <p className="text-gray-400 text-sm">
                      Show ads based on the content you're currently viewing
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("contextualTargeting")}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.contextualTargeting ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.contextualTargeting ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* External Opt-Out Options */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">External Opt-Out Tools</h2>
            <p className="text-gray-400 mb-6">
              You can also control ad tracking through industry-wide opt-out programs
            </p>

            <div className="space-y-4">
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 rounded-lg p-6 block hover:bg-gray-750 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Digital Advertising Alliance</h3>
                    <p className="text-gray-400 text-sm">youradchoices.com</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </a>

              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 rounded-lg p-6 block hover:bg-gray-750 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Network Advertising Initiative</h3>
                    <p className="text-gray-400 text-sm">optout.networkadvertising.org</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </a>

              <a
                href="https://www.youronlinechoices.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 rounded-lg p-6 block hover:bg-gray-750 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">European Interactive Digital Advertising Alliance</h3>
                    <p className="text-gray-400 text-sm">youronlinechoices.eu</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </a>
            </div>
          </section>

          {/* Mobile Device Settings */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Mobile Device Settings</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-400 mb-4">
                You can also control advertising identifiers through your device settings:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">iOS</h3>
                  <p className="text-gray-400 text-sm font-mono">
                    Settings → Privacy → Advertising → Limit Ad Tracking
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Android</h3>
                  <p className="text-gray-400 text-sm font-mono">
                    Settings → Google → Ads → Opt out of Ads Personalization
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end mb-12">
            <button
              onClick={handleDisableAll}
              className="px-6 py-3 rounded-full font-semibold text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 transition-colors"
            >
              Disable Personalization
            </button>
            <button
              onClick={handleEnableAll}
              className="px-6 py-3 rounded-full font-semibold bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Enable All
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-full font-semibold bg-green-600 hover:bg-green-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-12">
            <h3 className="text-lg font-bold mb-2">Learn More</h3>
            <p className="text-sm text-gray-300 mb-4">
              For more information about advertising and privacy:
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/about-ads" className="text-green-500 hover:underline text-sm">
                About Ads
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/privacy-policy" className="text-green-500 hover:underline text-sm">
                Privacy Policy
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/cookie-settings" className="text-green-500 hover:underline text-sm">
                Cookie Settings
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
