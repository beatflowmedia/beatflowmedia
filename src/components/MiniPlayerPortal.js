// MiniPlayerPortal.js
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import MiniPlayer from "./MiniPlayer";

export default function MiniPlayerPortal({ visible, ...props }) {
  const externalWindowRef = useRef(null);
  const containerEl = useRef(document.createElement("div"));

  useEffect(() => {
    if (!visible) return;

    // 1) Open a new window
    externalWindowRef.current = window.open(
      "",
      "_blank",
      "width=300,height=400,left=200,top=200"
    );

    // 2) If the pop-up was blocked or failed
    if (!externalWindowRef.current) {
      console.error("Popup blocked or failed to open.");
      return;
    }

    // 3) Write a minimal HTML doc
    const newDoc = externalWindowRef.current.document;
    newDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mini Player</title>
        </head>
        <body></body>
      </html>
    `);
    newDoc.close();

    // 4) Append the containerEl to the new doc's body
    newDoc.body.appendChild(containerEl.current);

    // Cleanup
    return () => {
      externalWindowRef.current.close();
    };
  }, [visible]);

  // If not visible or if the window didn't open, render nothing
  if (!visible || !externalWindowRef.current) {
    return null;
  }

  // Render your <MiniPlayer> inside the new window
  return ReactDOM.createPortal(
    <MiniPlayer {...props} />,
    containerEl.current
  );
}
