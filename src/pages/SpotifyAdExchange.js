import React from "react";
import { Link } from "react-router-dom";

export default function AdExchange() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Link
        to="/advertising"
        className="text-bf-green hover:underline mb-4 inline-block"
      >
        ⟵ Back to Advertising
      </Link>
      <h1 className="text-3xl font-bold mb-4">BeatFlow Media Ad Exchange</h1>
      <p className="text-gray-400">
        Learn about how BeatFlow partners with Spotify Ad Exchange to reach
        listeners at scale.
      </p>
    </div>
  );
}
