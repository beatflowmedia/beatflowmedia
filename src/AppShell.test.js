import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppShell from "./AppShell";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";

// Wrap AppShell with required Router and providers
const Providers = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("AppShell global shortcuts", () => {
  it("toggles queue panel visibility when Q is pressed", () => {
    const { container } = render(<AppShell />, { wrapper: Providers });
    const main = container.querySelector("main");
    // Initially, queue panel is closed => no margin class
    expect(main).not.toHaveClass("mr-96");
    // Press Q
    fireEvent.keyDown(window, { code: "KeyQ" });
    // Now main should have margin-right class for open panel
    expect(main).toHaveClass("mr-96");
    // Press Q again should close panel
    fireEvent.keyDown(window, { code: "KeyQ" });
    expect(main).not.toHaveClass("mr-96");
  });
});
