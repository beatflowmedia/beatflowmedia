import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function PrivacySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    profileVisibility: "public",
    showListeningActivity: true,
    showPlaylists: true,
    showFollowers: true,
    showFollowing: true,
    allowMessages: "everyone",
    sharePlaylistActivity: true,
    showRecentlyPlayed: true
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelect = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // TODO: Save to Firebase/backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 pt-16 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-400 mb-8">
              Please sign in to manage your privacy settings.
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/privacy-center" className="text-green-500 hover:underline mb-4 inline-block">
              ← Back to Privacy Center
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Privacy Settings</h1>
          <p className="text-xl text-gray-400 mb-12">
            Control who can see your activity and profile information
          </p>

          {/* Save Success Message */}
          {saved && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-8">
              <p className="text-green-500 font-semibold">✓ Settings saved successfully</p>
            </div>
          )}

          {/* Profile Visibility */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Profile Visibility</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Who can see your profile?</h3>
              <p className="text-gray-400 mb-4">
                Control who can view your profile, playlists, and activity
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={settings.profileVisibility === "public"}
                    onChange={() => handleSelect("profileVisibility", "public")}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <p className="text-white font-semibold">Public</p>
                    <p className="text-sm text-gray-400">Anyone can see your profile and activity</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={settings.profileVisibility === "followers"}
                    onChange={() => handleSelect("profileVisibility", "followers")}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <p className="text-white font-semibold">Followers Only</p>
                    <p className="text-sm text-gray-400">Only people who follow you can see your profile</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={settings.profileVisibility === "private"}
                    onChange={() => handleSelect("profileVisibility", "private")}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <p className="text-white font-semibold">Private</p>
                    <p className="text-sm text-gray-400">Only you can see your profile</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Activity Settings */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Activity Settings</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Show listening activity</h3>
                    <p className="text-gray-400 text-sm">
                      Let others see what you're currently listening to
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("showListeningActivity")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showListeningActivity ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showListeningActivity ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Show recently played</h3>
                    <p className="text-gray-400 text-sm">
                      Display your recently played songs on your profile
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("showRecentlyPlayed")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showRecentlyPlayed ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showRecentlyPlayed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Show playlists</h3>
                    <p className="text-gray-400 text-sm">
                      Allow others to see your public playlists
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("showPlaylists")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showPlaylists ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showPlaylists ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Share playlist activity</h3>
                    <p className="text-gray-400 text-sm">
                      Let followers see when you add songs to playlists
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("sharePlaylistActivity")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.sharePlaylistActivity ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.sharePlaylistActivity ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Social Settings */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Social Settings</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Show followers</h3>
                    <p className="text-gray-400 text-sm">
                      Display your followers list on your profile
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("showFollowers")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showFollowers ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showFollowers ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Show following</h3>
                    <p className="text-gray-400 text-sm">
                      Display who you're following on your profile
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("showFollowing")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showFollowing ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showFollowing ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Who can send you messages?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Control who can send you direct messages
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="allowMessages"
                      checked={settings.allowMessages === "everyone"}
                      onChange={() => handleSelect("allowMessages", "everyone")}
                      className="w-5 h-5 text-green-600"
                    />
                    <p className="text-white">Everyone</p>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="allowMessages"
                      checked={settings.allowMessages === "followers"}
                      onChange={() => handleSelect("allowMessages", "followers")}
                      className="w-5 h-5 text-green-600"
                    />
                    <p className="text-white">Followers Only</p>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="allowMessages"
                      checked={settings.allowMessages === "none"}
                      onChange={() => handleSelect("allowMessages", "none")}
                      className="w-5 h-5 text-green-600"
                    />
                    <p className="text-white">No One</p>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Data Rights */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Your Data Rights</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Download your data</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Request a copy of all your personal data
                </p>
                <Link
                  to="/download-data"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-full transition-colors"
                >
                  Request Data
                </Link>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Delete your account</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Permanently delete your account and all associated data
                </p>
                <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-4 mb-12">
            <Link
              to="/privacy-center"
              className="px-8 py-3 rounded-full font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
