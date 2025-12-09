import { usePlayer } from "./context/PlayerContext";
import { Outlet } from "react-router-dom";
import { usePanel } from "./context/PanelContext";

export default function AppShell() {
  const { state: panelState, closePanel } = usePanel();
  const { panelType, panelData } = panelState;

  return (
    <>
      {/* ...existing code... */}
      <ErrorBoundary>
        <RightPanel
          visible={panelType !== null}
          content={{ type: panelType, data: panelData }}
          onClose={closePanel}
        />
      </ErrorBoundary>
      {/* ...existing code... */}
    </>
  );
}
