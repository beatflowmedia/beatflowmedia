// src/components/AppUpdatePrompt.js
//
// "A new version is available. Reload to update?" as the app's own modal.
//
// It was a native window.confirm(), which the browser renders in its own chrome -- grey
// system dialog, a title that is the page origin rather than anything we chose, and OK /
// Cancel wording we cannot change. On beatflowmediagroup.com it appeared over a page
// still showing "Loading...", so the first thing a visitor saw was a browser-level
// prompt rather than the product.
//
// The registration lives in src/index.js, outside React, because it must run once per
// page load regardless of route. So it cannot render a modal itself. It dispatches
// `bfmg:update-available` on window instead, and this component -- mounted once in the
// tree -- listens and shows the real thing.
import { useEffect, useState } from 'react';
import Modal from './Modal';

export const UPDATE_AVAILABLE_EVENT = 'bfmg:update-available';

export default function AppUpdatePrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onUpdate = () => setOpen(true);
    window.addEventListener(UPDATE_AVAILABLE_EVENT, onUpdate);
    return () => window.removeEventListener(UPDATE_AVAILABLE_EVENT, onUpdate);
  }, []);

  return (
    <Modal
      isOpen={open}
      // Declining is a real choice, not a deferral to nag about. Someone part-way
      // through a checkout should be able to finish; the new version is picked up on
      // their next load either way.
      onClose={() => setOpen(false)}
      onConfirm={() => window.location.reload()}
      confirmLabel="Reload"
      cancelLabel="Not now"
      type="info"
      title="Update available"
      message="A new version of BeatFlow Media Group is ready. Reload to get it, or carry on and it will load next time."
    />
  );
}
