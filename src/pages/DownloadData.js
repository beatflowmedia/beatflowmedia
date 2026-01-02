import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function DownloadData() {
  const { user } = useAuth();
  const [selectedData, setSelectedData] = useState({
    accountInfo: true,
    listeningHistory: true,
    playlists: true,
    purchases: true,
    followersFollowing: true,
    likes: true,
    searchHistory: true,
    uploadedContent: true
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key) => {
    setSelectedData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmitRequest = () => {
    setIsSubmitting(true);
    // TODO: Submit request to backend
    setTimeout(() => {
      setIsSubmitting(false);
      setRequestSubmitted(true);
    }, 1500);
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 pt-16 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-400 mb-8">
              Please sign in to request your data.
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

  if (requestSubmitted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-1 pt-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="text-6xl mb-6">✓</div>
              <h1 className="text-4xl font-bold mb-4">Request Submitted</h1>
              <p className="text-xl text-gray-400 mb-8">
                Your data download request has been received.
              </p>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-3">What happens next?</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• We'll prepare your data package (usually within 24-48 hours)</li>
                  <li>• You'll receive an email at <strong>{user.email}</strong> with a download link</li>
                  <li>• The download link will be valid for 7 days</li>
                  <li>• Your data will be provided in JSON format for easy portability</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/privacy-center"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
                >
                  Back to Privacy Center
                </Link>
                <Link
                  to="/"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
                >
                  Go to Home
                </Link>
              </div>
            </div>
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

          <h1 className="text-5xl font-bold mb-4">Download Your Data</h1>
          <p className="text-xl text-gray-400 mb-12">
            Request a copy of your personal information stored on BeatFlow Media
          </p>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">About Your Data Export</h3>
            <div className="text-gray-300 space-y-2">
              <p>
                Under data protection laws (including GDPR and CCPA), you have the right to request a copy
                of all personal information we hold about you.
              </p>
              <p>
                Your data will be provided in JSON format, which can be easily imported into other services
                or viewed with any text editor.
              </p>
              <p className="text-sm text-gray-400 mt-4">
                <strong>Processing Time:</strong> 24-48 hours | <strong>Download Link Valid:</strong> 7 days
              </p>
            </div>
          </div>

          {/* Data Categories */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Select Data to Include</h2>
            <p className="text-gray-400 mb-6">
              Choose which categories of data you'd like to include in your export
            </p>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                    <p className="text-gray-400 text-sm">
                      Email, username, registration date, subscription status
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("accountInfo")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.accountInfo ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.accountInfo ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Listening History</h3>
                    <p className="text-gray-400 text-sm">
                      All songs you've played, with timestamps and play counts
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("listeningHistory")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.listeningHistory ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.listeningHistory ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Playlists</h3>
                    <p className="text-gray-400 text-sm">
                      All playlists you've created, including track listings and metadata
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("playlists")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.playlists ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.playlists ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Purchase History</h3>
                    <p className="text-gray-400 text-sm">
                      Songs, albums, and licenses you've purchased
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("purchases")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.purchases ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.purchases ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Followers & Following</h3>
                    <p className="text-gray-400 text-sm">
                      Users who follow you and users you follow
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("followersFollowing")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.followersFollowing ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.followersFollowing ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Likes & Favorites</h3>
                    <p className="text-gray-400 text-sm">
                      Songs and albums you've liked or favorited
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("likes")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.likes ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.likes ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Search History</h3>
                    <p className="text-gray-400 text-sm">
                      Your search queries and browsing history
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("searchHistory")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.searchHistory ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.searchHistory ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Uploaded Content (Artists Only)</h3>
                    <p className="text-gray-400 text-sm">
                      Songs, albums, and metadata you've uploaded as an artist
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("uploadedContent")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedData.uploadedContent ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedData.uploadedContent ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Submit Section */}
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold mb-4">Ready to submit your request?</h3>
            <p className="text-gray-400 mb-6">
              We'll send you an email at <strong className="text-white">{user.email}</strong> when
              your data is ready to download.
            </p>
            <div className="flex gap-4">
              <Link
                to="/privacy-center"
                className="px-8 py-3 rounded-full font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitting || !Object.values(selectedData).some(v => v)}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>

          {/* Legal Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mb-12">
            <h3 className="text-lg font-bold mb-2">Legal Information</h3>
            <p className="text-sm text-gray-300">
              This data export is provided in accordance with GDPR Article 20 (Right to Data Portability)
              and CCPA Section 1798.110 (Right to Know). For more information, see our{" "}
              <Link to="/privacy-policy" className="text-green-500 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
