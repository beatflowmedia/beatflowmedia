import React from "react";

// Manual mock for react-router-dom.
//
// Jest picks this up AUTOMATICALLY for the node_modules package -- no jest.mock() call is
// needed anywhere -- which makes it easy to forget it exists. It previously exported only
// BrowserRouter, Routes and Route, so any component importing Link or MemoryRouter got
// `undefined` and React failed with:
//
//   Element type is invalid ... but got: undefined
//
// That message points at the component under test rather than at this file, and the same
// import works in plain node, which sends you chasing module resolution and export
// conditions instead. It cost a while. Anything added to this mock must stay a superset
// of what components actually import.

/** Routers are pass-throughs: tests render the subject, not a routing tree. */
export const BrowserRouter = ({ children }) => <>{children}</>;
export const MemoryRouter = ({ children }) => <>{children}</>;
export const HashRouter = ({ children }) => <>{children}</>;

export const Routes = ({ children }) => <>{children}</>;
export const Route = ({ element, children }) => element || <>{children}</>;

/**
 * A real anchor, deliberately.
 *
 * Several components rely on a link being a genuine <a> inside a <label> -- the click
 * must be stoppable, and a tap on the link must NOT toggle the checkbox that wraps it.
 * A <span> stub would make that test vacuous: it would pass whether or not the component
 * called stopPropagation.
 *
 * `to` maps to href so queries by role and name behave as they do in the app, and
 * navigation is prevented so a click cannot trip jsdom's "not implemented" navigation.
 */
export const Link = ({ to, children, onClick, ...rest }) => (
  <a
    href={typeof to === "string" ? to : "#"}
    onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick(e);
    }}
    {...rest}
  >
    {children}
  </a>
);

export const NavLink = Link;

export const Navigate = () => null;
export const Outlet = ({ children }) => <>{children}</>;

export const useNavigate = () => () => {};
export const useLocation = () => ({ pathname: "/", search: "", hash: "", state: null });
export const useParams = () => ({});
export const useSearchParams = () => [new URLSearchParams(), () => {}];
