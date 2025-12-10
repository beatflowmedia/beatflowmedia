// MiniPlayerPortal.js
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import MiniPlayer from "./MiniPlayer";

export default function MiniPlayerPortal({ visible, ...props }) {
  const externalWindowRef = useRef(null);
  const containerEl = useRef(document.createElement("div"));

  useEffect(() => {
    if (!visible) return;

    // 1) Open a new window with 9:16 aspect ratio (not resizable)
    externalWindowRef.current = window.open(
      "",
      "_blank",
      "width=350,height=622,left=200,top=200,resizable=no",
    );

    // 2) If the pop-up was blocked or failed
    if (!externalWindowRef.current) {
      console.error("Popup blocked or failed to open.");
      return;
    }

    // 3) Write a minimal HTML doc with styles
    const newDoc = externalWindowRef.current.document;

    // Copy all stylesheets from parent window
    const stylesheets = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    const styleHTML = stylesheets.map(sheet => {
      if (sheet.tagName === 'LINK') {
        return `<link rel="stylesheet" href="${sheet.href}">`;
      } else {
        return `<style>${sheet.innerHTML}</style>`;
      }
    }).join('\n');

    newDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BeatFlow Music Player</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="description" content="BeatFlow - Premium music streaming and licensing platform">
          <link rel="icon" href="/images/Logo.svg" type="image/svg+xml">
          ${styleHTML}
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #000;
              overflow: hidden;
            }
          </style>
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

  // Render your <MiniPlayer> inside the new window with isPopup flag
  return ReactDOM.createPortal(<MiniPlayer {...props} isPopup={true} />, containerEl.current);
}
