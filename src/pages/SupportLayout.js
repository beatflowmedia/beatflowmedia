import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function SupportLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-bf-page">
      <NavBar />
      <main className="flex-1 bg-bf-page text-white pt-16 px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
