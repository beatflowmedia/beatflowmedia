import React from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function SupportCategory() {
  const { slug } = useParams();
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col min-h-screen bg-bf-page">
      <NavBar />
      <main className="flex-1 pt-16 px-6 text-white">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-gray-300">
          Content for the "{title}" support category coming soon.
        </p>
      </main>
      <Footer />
    </div>
  );
}
