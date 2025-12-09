import React from "react";
import { Link } from "react-router-dom";

export default function Wrapped2024() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Link
        to="/advertising"
        className="text-bf-green hover:underline mb-4 inline-block"
      >
        ⟵ Back to Advertising
      </Link>
      <h1 className="text-3xl font-bold mb-4">
        BeatFlow Media Wrapped for Advertisers 2024
      </h1>
      <p className="text-gray-400">
        Highlights and insights from our 2024 advertising wrap-up.
      </p>
    </div>
  );
}
