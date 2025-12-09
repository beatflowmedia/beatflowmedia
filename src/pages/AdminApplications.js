import React from "react";
import { Link } from "react-router-dom";
import useApplications from "../hooks/useApplications";

export default function AdminApplications() {
  const { applications } = useApplications();

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar with quick links */}
      <nav className="w-60 bg-gray-800 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Admin Menu</h2>
        <Link to="/admin/dashboard" className="block hover:text-gray-300">
          Dashboard
        </Link>
        <Link to="/admin/panel" className="block hover:text-gray-300">
          Music Panel
        </Link>
        <Link to="/admin/applications" className="block hover:text-gray-300">
          Job Applications
        </Link>
      </nav>
      {/* Main content area */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-4">Job Applications</h1>
        {applications.length === 0 ? (
          <p>No applications submitted yet.</p>
        ) : (
          <ul className="space-y-6">
            {applications.map((app) => (
              <li key={app.id} className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">{app.jobTitle}</h2>
                <p>
                  <strong>Name:</strong> {app.name}
                </p>
                <p>
                  <strong>Email:</strong> {app.email}
                </p>
                <p className="mb-2">
                  <strong>Cover Letter:</strong> {app.message}
                </p>
                <a
                  href={app.resumeURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bf-green hover:underline"
                >
                  Download Resume
                </a>
                <p className="text-gray-400 text-sm mt-2">
                  Submitted at:{" "}
                  {app.submittedAt?.seconds
                    ? new Date(app.submittedAt.seconds * 1000).toLocaleString()
                    : "Unknown"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
