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
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { hasUnseenChanges, getLastSeenChangeDate } from '../data/platformChanges';

export const UPDATE_AVAILABLE_EVENT = 'bfmg:update-available';

export default function AppUpdatePrompt() {
  const [open, setOpen] = useState(false);
  // Whether to offer "see what changed". Resolved when the prompt OPENS rather than at
  // mount, so a reader who visited /changes earlier in the same session is not offered a
  // link to something they have just read.
  const [showChanges, setShowChanges] = useState(false);

  useEffect(() => {
    const onUpdate = () => {
      setShowChanges(hasUnseenChanges(getLastSeenChangeDate()));
      setOpen(true);
    };
    window.addEventListener(UPDATE_AVAILABLE_EVENT, onUpdate);
    return () => window.removeEventListener(UPDATE_AVAILABLE_EVENT, onUpdate);
  }, []);

  // THE PROMPT ALWAYS APPEARS; THE LINK ALMOST NEVER DOES.
  //
  // Two different jobs, and conflating them is how both get ignored. The prompt exists
  // to get new code onto the device -- security fixes, the cached-bundle failure that
  // broke checkout on 2026-10-15 -- and that is worth asking about on every deploy
  // whether or not there is a story to tell.
  //
  // The LINK exists for the rare change that alters what someone actually gets: their
  // license, a price, what the platform does. If it appeared every time, it would
  // usually lead to "fixed a redirect rule", and a link that is usually worthless is a
  // link nobody clicks on the one occasion it matters.
  const message = showChanges ? (
    <>
      A new version of BeatFlow Media Group is ready. Reload to get it, or carry on and it
      will load next time.
      <span style={{ display: 'block', marginTop: '0.75rem' }}>
        {/* min-height 44px: this is read on a phone more often than not, and an
          * underlined phrase inside a sentence is not a tap target. */}
        <Link
          to="/changes"
          onClick={() => setOpen(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            color: '#1DB954',
            fontWeight: 600
          }}
        >
          See what changed →
        </Link>
      </span>
    </>
  ) : (
    'A new version of BeatFlow Media Group is ready. Reload to get it, or carry on and it will load next time.'
  );

  return (
    <Modal
      isOpen={open}
      // Declining is a real choice, not a deferral to nag about. Someone part-way
      // through a checkout should be able to finish; the new version is picked up on
      // their next load either way.
      //
      // Dismissing does NOT mark the changes as read. Closing a modal is not reading,
      // and treating it as read would silently consume the one notice a license change
      // gets. markChangesSeen() is called by the /changes page itself.
      onClose={() => setOpen(false)}
      onConfirm={() => window.location.reload()}
      confirmLabel="Reload"
      cancelLabel="Not now"
      type="info"
      title="Update available"
      message={message}
    />
  );
}
