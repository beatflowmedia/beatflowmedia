import React, { createContext, useContext, useReducer , useCallback, useMemo } from "react";

// Panel types: 'queue', 'playlist', 'artist', etc.
const initialState = { panelType: null, panelData: null };

const OPEN_PANEL = "OPEN_PANEL";
const CLOSE_PANEL = "CLOSE_PANEL";

function panelReducer(state, action) {
  switch (action.type) {
    case OPEN_PANEL:
      return {
        panelType: action.payload.panelType,
        panelData: action.payload.data || null
      };
    case CLOSE_PANEL:
      return { panelType: null, panelData: null };
    default:
      return state;
  }
}

const PanelContext = createContext();

export const PanelProvider = ({ children }) => {
  const [state, dispatch] = useReducer(panelReducer, initialState);
  // Actions
  const openPanel = React.useCallback((panelType, data = null) => {
    dispatch({ type: OPEN_PANEL, payload: { panelType, data } });
  }, []);
  const closePanel = React.useCallback(() => {
    dispatch({ type: CLOSE_PANEL });
  }, []);
  // Memoize context value to avoid re-renders
  const value = React.useMemo(
    () => ({ state, openPanel, closePanel }),
    [state, openPanel, closePanel],
  );
  return (
    <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
  );
};

export const usePanel = () => {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used within PanelProvider");
  return ctx;
};
