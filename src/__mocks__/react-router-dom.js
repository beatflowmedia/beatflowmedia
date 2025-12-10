import React from "react";

// Mock react-router-dom's BrowserRouter for tests
export const BrowserRouter = ({ children }) => <>{children}</>;

// Mock Routes and Route to render children/element props
export const Routes = ({ children }) => <>{children}</>;
export const Route = ({ element, children }) => element || <>{children}</>;
