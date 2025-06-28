import React, { useEffect, useState } from "react";

// This dashboard is for curators/admins to review and manage submissions
const CuratorDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [status, setStatus] = useState({});
  const [message, setMessage] = useState("");

  // Replace with real curator/admin user ID in production
  const curatorId = "admin";

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      const res = await fetch("/.netlify/functions/submissions?mode=curator", {
        headers: { "x-user-id": curatorId },
      });
      const data = await res.json();
      setSubmissions(data);
      setLoading(false);
    };
    fetchSubmissions();
  }, []);

  const handleUpdate = async (id, newStatus) => {
    setMessage("");
    const res = await fetch("/.netlify/functions/submissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": curatorId },
      body: JSON.stringify({ id, status: newStatus, feedback: feedback[id] || "" }),
    });
    if (res.ok) {
      setMessage("Updated!");
      setStatus((prev) => ({ ...prev, [id]: newStatus }));
    } else {
      setMessage("Update failed");
    }
  };

  if (loading) return <div className="p-6 text-white">Loading submissions...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">Curator Submissions</h1>
      {submissions.length === 0 && <p>No submissions found.</p>}
      {submissions.map((sub) => (
        <div key={sub.id} className="bg-gray-800 p-4 rounded mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-semibold">Song ID: {sub.songId}</div>
              <div className="text-sm text-gray-400">Artist ID: {sub.artistId}</div>
              <div className="text-sm text-gray-400">Playlist ID: {sub.playlistId}</div>
              <div className="text-sm text-gray-400">Status: {sub.status}</div>
            </div>
            <div className="flex flex-col gap-2">
              <select
                value={status[sub.id] || sub.status}
                onChange={(e) => setStatus((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                className="bg-gray-700 text-white rounded p-1"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
              <input
                type="text"
                placeholder="Feedback (optional)"
                value={feedback[sub.id] || sub.feedback || ""}
                onChange={(e) => setFeedback((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                className="bg-gray-700 text-white rounded p-1 mt-1"
              />
              <button
                onClick={() => handleUpdate(sub.id, status[sub.id] || sub.status)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mt-2"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      ))}
      {message && <div className="mt-4 text-center text-sm">{message}</div>}
    </div>
  );
};

export default CuratorDashboard;
