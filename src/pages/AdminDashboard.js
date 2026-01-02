import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminDashboardAnalytics from "../components/analytics/AdminDashboard";
import SecurityDashboard from "../components/admin/SecurityDashboard";
import ContentIngestionDashboard from "../components/ContentIngestionDashboard";
import CuratorApplications from "../components/admin/CuratorApplications";
import ContentManagement from "../components/admin/ContentManagement";
import AppealsReview from "../components/admin/AppealsReview";
import { adminAnalytics } from "../services/adminAnalytics";
import {
  Dashboard,
  BarChart,
  Security,
  CloudUpload,
  PlaylistPlay,
  Work,
  ArrowBack,
  Block,
  Gavel
} from "@mui/icons-material";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminAnalytics.getPlatformStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-gray-800 p-6 space-y-2">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-400">Admin Portal</h1>
          <p className="text-sm text-gray-400">Platform Management</p>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "overview"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Dashboard fontSize="small" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "analytics"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <BarChart fontSize="small" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "security"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Security fontSize="small" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab("content")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "content"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <CloudUpload fontSize="small" />
            <span>Content Ingestion</span>
          </button>

          <button
            onClick={() => setActiveTab("curators")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "curators"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <PlaylistPlay fontSize="small" />
            <span>Curator Applications</span>
          </button>

          <button
            onClick={() => setActiveTab("contentManagement")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "contentManagement"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Block fontSize="small" />
            <span>Content Takedown</span>
          </button>

          <button
            onClick={() => setActiveTab("appeals")}
            className={`w-full text-left px-4 py-2 rounded transition flex items-center gap-3 ${
              activeTab === "appeals"
                ? "bg-green-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Gavel fontSize="small" />
            <span>Appeals Review</span>
          </button>

          <Link
            to="/admin/applications"
            className="block w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-gray-300 transition flex items-center gap-3"
          >
            <Work fontSize="small" />
            <span>Job Applications</span>
          </Link>
        </div>

        {/* Additional Links */}
        <div className="mt-8 pt-8 border-t border-gray-700 space-y-1">
          <Link
            to="/"
            className="block px-4 py-2 text-gray-400 hover:text-white transition flex items-center gap-3"
          >
            <ArrowBack fontSize="small" />
            <span>Back to Platform</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Platform Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Quick Stats Cards */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Total Users</div>
                <div className="text-3xl font-bold text-green-400">
                  {loading ? '...' : (stats?.totalUsers || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">Platform-wide</div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Active Songs</div>
                <div className="text-3xl font-bold text-blue-400">
                  {loading ? '...' : (stats?.totalSongs || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">In library</div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Applications</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {loading ? '...' : (stats?.pendingApplications || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-2">Pending review</div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Artists</div>
                <div className="text-3xl font-bold text-purple-400">
                  {loading ? '...' : (stats?.totalArtists || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">On platform</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                >
                  <div className="font-semibold mb-1">View Analytics</div>
                  <div className="text-sm text-gray-400">Platform metrics & insights</div>
                </button>

                <button
                  onClick={() => setActiveTab("security")}
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                >
                  <div className="font-semibold mb-1">Security Dashboard</div>
                  <div className="text-sm text-gray-400">Monitor threats & access</div>
                </button>

                <button
                  onClick={() => setActiveTab("content")}
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                >
                  <div className="font-semibold mb-1">Manage Content</div>
                  <div className="text-sm text-gray-400">Upload & organize media</div>
                </button>

                <Link
                  to="/admin/applications"
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                >
                  <div className="font-semibold mb-1">Review Applications</div>
                  <div className="text-sm text-gray-400">Job application inbox</div>
                </Link>

                <Link
                  to="/admin/panel"
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                >
                  <div className="font-semibold mb-1">Music Panel</div>
                  <div className="text-sm text-gray-400">Manage music library</div>
                </Link>

                <Link
                  to="/curator-inbox"
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                >
                  <div className="font-semibold mb-1">Curator Inbox</div>
                  <div className="text-sm text-gray-400">Review submissions</div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Analytics Dashboard</h2>
            <AdminDashboardAnalytics />
          </div>
        )}

        {activeTab === "security" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Security Dashboard</h2>
            <SecurityDashboard />
          </div>
        )}

        {activeTab === "content" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Content Ingestion</h2>
            <ContentIngestionDashboard />
          </div>
        )}

        {activeTab === "curators" && (
          <div>
            <CuratorApplications />
          </div>
        )}

        {activeTab === "contentManagement" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Content Takedown & Management</h2>
            <ContentManagement />
          </div>
        )}

        {activeTab === "appeals" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Appeals Review with AI Analysis</h2>
            <AppealsReview />
          </div>
        )}
      </main>
    </div>
  );
}
