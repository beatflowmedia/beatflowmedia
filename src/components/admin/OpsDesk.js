// src/components/admin/OpsDesk.js
//
// THE OPS DESK, as a panel of the Admin Portal.
//
// Adapted from the station's ops.html, which Percy already uses to approve incidents.
// Same three ideas -- a queue of things needing his decision, his own to-dos, and an
// approval gate nothing bypasses -- with the parts that only suited the station left out.
//
// WHAT CHANGED FOR BFMG
//
//   IT IS A PANEL, NOT A PAGE. The station serves ops.html from its own serve.js bound
//   to 127.0.0.1, because it has no app and no accounts. BFMG has an Admin Portal with a
//   sidebar and an isPlatformAdmin gate, so the desk belongs beside Analytics and
//   Security rather than at a URL of its own. A separate page would be a second place to
//   remember.
//
//   CHECKS TAB, which the station has no equivalent for. BFMG already owns twenty
//   verify:* reconcilers whose output dies in a terminal nobody watches, so this desk is
//   useful on day one with zero incidents filed. That is the main reason the adaptation
//   is worth more here than the original.
//
//   "FOR YOU" IS THE DEFAULT TAB, because on day one it is the only one with anything in
//   it, and because those items have been sitting inside a 4,000-line CLAUDE.md where
//   nothing surfaces them.
//
// TAILWIND, not the inline styles this started as, because every other panel in the
// Admin Portal is Tailwind and a panel that styles itself differently reads as bolted on.

import { useCallback, useEffect, useState } from 'react';
import {
  AREAS, SEVERITY_MEANS, STATUSES, needsPercy, isPercys, referenceFor, searchItems
} from '../../utils/ops';
import { loadOpsItems, decide, countWaitingWork, askClaude } from '../../services/opsStore';
import { waitingSources, totalWaiting } from '../../utils/opsWork';

// Severity as colour, defined once. Tailwind cannot compute these from a variable at
// build time, so the map is explicit rather than interpolated -- an interpolated class
// name is a class Tailwind never emits.
const SEVERITY_CLASS = {
  critical: 'bg-red-500 text-black',
  high: 'bg-orange-500 text-black',
  medium: 'bg-yellow-400 text-black',
  low: 'bg-gray-500 text-black'
};

const STATE_CLASS = {
  pass: 'bg-green-500 text-black',
  fail: 'bg-red-500 text-black',
  unknown: 'bg-gray-500 text-black'
};

function Pill({ children, className, title }) {
  return (
    <span
      title={title}
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Copy text, with a fallback that still hands it over.
 *
 * The clipboard API can be refused -- permissions, an embedded browser, an insecure
 * origin -- and a Copy button that silently does nothing reads as a command that WAS
 * copied. The station learned this the same way; the fallback shows the text so it can
 * be selected by hand.
 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (err) {
    return { ok: false, text };
  }
}

/** The short reference, shown on every item so it can be quoted back. Monospace and
 *  selectable: the point is that it gets copied into a message or a commit. */
function Reference({ id }) {
  const ref = referenceFor(id);
  if (!ref) return null;
  return (
    <span className="font-mono text-[11px] text-gray-400 select-all tracking-wider">
      {ref}
    </span>
  );
}

/** Copy / Send to Claude, on every item. Defined once so the two tabs cannot drift. */
function ClaudeActions({ item, busy, onCopy, onAsk }) {
  const queued = item.claudeRequest?.status === 'queued';
  return (
    <div className="flex gap-2 flex-wrap items-center mt-2">
      <button
        onClick={() => onCopy(item)}
        className="min-h-[44px] px-4 rounded-lg border border-gray-600 hover:bg-gray-700 text-[15px] font-bold"
        title="Copies the reference and title to paste in the chat with Claude"
      >
        Copy
      </button>
      <button
        onClick={() => onAsk(item)}
        disabled={busy === item.id}
        className={`min-h-[44px] px-4 rounded-lg text-[15px] font-bold ${
          busy === item.id
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'border border-green-600 text-green-500 hover:bg-green-600/10'
        }`}
        title="Queues this for Claude to look into. Approves nothing."
      >
        {busy === item.id ? 'Sending…' : 'Send to Claude'}
      </button>
      {queued ? (
        <span className="text-green-500 text-[13px] font-bold">
          queued {new Date(item.claudeRequest.at).toLocaleDateString()}
        </span>
      ) : null}
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="border border-gray-700 rounded-lg p-4 mb-3 bg-gray-800/40">
      {children}
    </div>
  );
}

/** A control that meets the 44px tap floor without restyling at each call site. */
function Action({ onClick, children, primary, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] min-w-[44px] px-4 rounded-lg text-[15px] font-bold transition ${
        disabled
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
          : primary
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'border border-gray-600 hover:bg-gray-700 text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function OpsDesk({ onNavigate }) {
  const [state, setState] = useState({ items: [], checks: [], loading: true });
  const [work, setWork] = useState({});
  const [tab, setTab] = useState('you');
  const [busy, setBusy] = useState(null);
  const [q, setQ] = useState('');
  const [toast, setToast] = useState(null);
  const [manualCopy, setManualCopy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      // In parallel: the desk's own items, and how much work is waiting in the other
      // admin queues. The counts are the answer to "does a person need to do a job
      // right now", which is the question this desk exists to consolidate.
      const [data, counts] = await Promise.all([loadOpsItems(), countWaitingWork()]);
      setWork(counts);
      setState({ ...data, loading: false });
      if (data.storeError) setError(data.storeError);
    } catch (err) {
      console.error('OpsDesk: load failed —', err);
      setState({ items: [], checks: [], loading: false });
      setError(err.message || 'Could not load the ops desk.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDecide = async (item, to, note) => {
    setBusy(item.id);
    setError(null);
    try {
      await decide(item, to, note);
      await load();
    } catch (err) {
      // Shown, never swallowed. A decision that failed silently is worse than one that
      // refused, because the list still looks right.
      console.error('OpsDesk: decision failed —', err);
      setError(err.message || 'Could not save that decision.');
    } finally {
      setBusy(null);
    }
  };

  /** The line Percy pastes into the chat. One place builds it, so what the button
   *  copies and what the toast claims it copied cannot disagree. */
  const chatLineFor = (item) => `Look at ${referenceFor(item.id)} — ${item.title}`;

  const onCopy = async (item) => {
    const result = await copyText(chatLineFor(item));
    if (result.ok) {
      setToast(`Copied. Paste it in the chat with Claude.`);
      setTimeout(() => setToast(null), 4000);
    } else {
      setManualCopy(result.text);
    }
  };

  const onAskClaude = async (item) => {
    // Asking is not approving, and the prompt says so. A button that quietly granted
    // permission would make the approval gate theatre.
    const message = window.prompt(
      [
        `Send ${referenceFor(item.id)} to Claude.`,
        '',
        'Claude picks this up and looks into it. It approves nothing — merging and',
        'deploying still need your words in the chat.',
        '',
        'Anything specific to look at? (optional)'
      ].join('\n')
    );
    if (message === null) return; // cancelled
    setBusy(item.id);
    setError(null);
    try {
      await askClaude(item, message);
      await load();
      setToast(`${referenceFor(item.id)} queued for Claude. Say "check ops" in the chat.`);
      setTimeout(() => setToast(null), 6000);
    } catch (err) {
      console.error('OpsDesk: could not queue a request —', err);
      setError(err.message || 'Could not send that to Claude.');
    } finally {
      setBusy(null);
    }
  };

  const { items, checks, loading, checksLastRun } = state;

  // FILTERED BEFORE SPLITTING, so the tab badges count MATCHES while searching rather
  // than totals. A search that leaves "For you 6" on the tab while showing one card
  // makes the badge a liar at the exact moment you are trying to find something.
  const visible = searchItems(items, q);
  const visibleChecks = searchItems(checks, q);
  const searching = q.trim().length > 0;

  const mine = visible.filter(isPercys);
  const filed = visible.filter((i) => !isPercys(i));
  const openMine = mine.filter(needsPercy);
  const openFiled = filed.filter(needsPercy);
  const failing = visibleChecks.filter((c) => c.state === 'fail');
  const sources = waitingSources(work);
  const waitingTotal = totalWaiting(work);
  const unknown = visibleChecks.filter((c) => c.state === 'unknown');

  const TABS = [
    // Counts BOTH: Percy's own backlog and anything waiting in another queue. A tab
    // badge that only counted half of "needs a person" would be the same fragmented
    // answer this desk was built to replace.
    // Counts BOTH Percy's own backlog and anything waiting in another queue -- a badge
    // that counted half of "needs a person" would be the fragmented answer this desk
    // replaced. While searching it counts matches instead, since the queue counts are
    // not filterable and showing them beside filtered cards would be confusing.
    { key: 'you', label: 'For you', count: searching ? mine.length : openMine.length + waitingTotal },
    { key: 'incidents', label: 'Incidents', count: searching ? filed.length : openFiled.length },
    { key: 'checks', label: 'Checks', count: searching ? visibleChecks.length : failing.length }
  ];

  return (
    <div>
      <p className="text-gray-400 text-sm mb-5 leading-relaxed max-w-3xl">
        What needs you, what has been filed, and whether the automated checks last
        passed. Nothing here deploys anything.
      </p>

      {toast ? (
        <div className="border border-green-600 bg-green-600/10 rounded-lg px-4 py-3 mb-4 text-sm">
          {toast}
        </div>
      ) : null}

      {/* The clipboard was refused, so the text is shown to be selected by hand. A Copy
          button that silently did nothing would read as a command that was copied. */}
      {manualCopy ? (
        <div className="border border-gray-600 rounded-lg px-4 py-3 mb-4 text-sm">
          <p className="mb-2 text-gray-300">Copy this and paste it in the chat with Claude:</p>
          <code className="block select-all bg-gray-900 p-2 rounded break-all">{manualCopy}</code>
          <button onClick={() => setManualCopy(null)} className="mt-2 min-h-[44px] underline">
            Done
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-500 bg-red-500/10 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      ) : null}

      {/* SEARCH. Matches every word anywhere in an item -- title, description, note,
          area, file paths, and the OPS- reference -- so pasting a code lands on it and
          "stripe price" finds a title where those words are nowhere near each other.
          type="search" gives the browser's own clear affordance for free. */}
      <div className="mb-4">
        <label htmlFor="ops-search" className="sr-only">Search the ops desk</label>
        <input
          id="ops-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search — a word, a file, or a reference like OPS-X96P6"
          // 16px minimum: anything smaller makes mobile Safari zoom the whole page on
          // focus, and 44px tall keeps it a real target.
          className="w-full min-h-[44px] px-4 text-base rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        {searching ? (
          <p className="text-gray-400 text-[13px] mt-2">
            {mine.length + filed.length + visibleChecks.length} match
            {mine.length + filed.length + visibleChecks.length === 1 ? '' : 'es'} across all tabs.
            <button
              onClick={() => setQ('')}
              className="ml-2 underline hover:text-white"
            >
              Clear
            </button>
          </p>
        ) : null}
      </div>

      {/* Scrolls rather than wraps: three tabs with counts do not fit a phone, and a
          wrapped tab row reads as two rows of unrelated buttons. */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`min-h-[44px] px-4 rounded-lg whitespace-nowrap text-[15px] font-bold transition ${
              tab === t.key
                ? 'bg-green-600 text-white'
                : 'border border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 ? (
              <span className={`ml-2 px-1.5 py-px rounded-full text-xs ${
                tab === t.key ? 'bg-black/30 text-white' : 'bg-green-600 text-white'
              }`}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">Loading…</p> : null}

      {/* ---------------- FOR YOU ---------------- */}
      {!loading && tab === 'you' ? (
        <>
          {/* WORK WAITING IN THE OTHER QUEUES, first, because it is somebody else
              waiting on Percy rather than Percy's own backlog. An appeal nobody has
              ruled on blocks a person's account; a note to call a lawyer does not. */}
          {!searching && sources.length ? (
            <div className="border border-gray-700 rounded-lg p-4 mb-5 bg-gray-800/40">
              <h3 className="text-base font-bold mb-1">
                {waitingTotal} {waitingTotal === 1 ? 'thing is' : 'things are'} waiting on a person
              </h3>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-3">
                Held in other panels. The panel that owns a queue owns the decision — this
                is a pointer, not a second place to approve things.
              </p>
              <div className="flex flex-col gap-2">
                {sources.map((srcItem) => (
                  <div key={srcItem.key} className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <span className="font-bold">{srcItem.label}</span>
                      {srcItem.error ? (
                        <span className="text-orange-400 text-[13px] ml-2">
                          could not check ({srcItem.error})
                        </span>
                      ) : (
                        <span className="text-green-500 font-bold ml-2">{srcItem.count}</span>
                      )}
                      <p className="text-gray-400 text-[13px] leading-relaxed mt-0.5">{srcItem.why}</p>
                    </div>
                    {srcItem.tab && onNavigate ? (
                      <button
                        onClick={() => onNavigate(srcItem.tab)}
                        className="min-h-[44px] px-4 rounded-lg border border-gray-600 hover:bg-gray-700 text-[15px] font-bold whitespace-nowrap"
                      >
                        Open
                      </button>
                    ) : srcItem.route ? (
                      <a
                        href={srcItem.route}
                        className="min-h-[44px] px-4 rounded-lg border border-gray-600 hover:bg-gray-700 text-[15px] font-bold whitespace-nowrap flex items-center"
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {searching && mine.length === 0 ? (
            <p className="text-gray-400">No matches on this tab.</p>
          ) : null}
          {!searching && openMine.length === 0 && !sources.length ? (
            <p className="text-gray-400">Nothing waiting on you.</p>
          ) : null}
          {mine.map((item) => (
            <Card key={item.id}>
              <div className="flex gap-2 flex-wrap items-center mb-2">
                <Reference id={item.id} />
                <Pill className={SEVERITY_CLASS[item.severity]} title={SEVERITY_MEANS[item.severity]}>
                  {item.severity}
                </Pill>
                <Pill className="bg-gray-700 text-gray-200" title={AREAS[item.area]}>
                  {item.area}
                </Pill>
                {item.forLawyer ? <Pill className="bg-blue-400 text-black">for a lawyer</Pill> : null}
                {item.status !== 'open' ? (
                  <Pill className="bg-gray-700 text-gray-200">
                    {STATUSES[item.status]?.label || item.status}
                  </Pill>
                ) : null}
              </div>

              <h3 className="text-[17px] font-bold mb-2 leading-snug">{item.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">{item.what}</p>

              {item.note ? (
                <p className="text-gray-400 text-[13px] leading-relaxed mb-3 pl-3 border-l-2 border-gray-600">
                  {item.note}
                </p>
              ) : null}

              {item.where?.length ? (
                <p className="text-gray-500 text-xs mb-3 break-all">{item.where.join(' · ')}</p>
              ) : null}

              {needsPercy(item) ? (
                <div className="flex gap-2 flex-wrap">
                  <Action primary disabled={busy === item.id} onClick={() => onDecide(item, 'resolved', 'Done')}>
                    {busy === item.id ? 'Saving…' : 'Done'}
                  </Action>
                  <Action disabled={busy === item.id} onClick={() => onDecide(item, 'declined', 'Not doing this')}>
                    Not doing this
                  </Action>
                </div>
              ) : (
                <p className="text-green-500 text-[13px] font-bold">
                  {STATUSES[item.status]?.label || item.status}
                </p>
              )}
              <ClaudeActions item={item} busy={busy} onCopy={onCopy} onAsk={onAskClaude} />
            </Card>
          ))}
        </>
      ) : null}

      {/* ---------------- INCIDENTS ---------------- */}
      {!loading && tab === 'incidents' ? (
        <>
          {filed.length === 0 ? (
            <p className="text-gray-400 leading-relaxed max-w-2xl">
              No incidents filed. Nothing reviews the codebase on a schedule yet — this
              tab fills when something does.
            </p>
          ) : null}
          {filed.map((item) => (
            <Card key={item.id}>
              <div className="flex gap-2 flex-wrap items-center mb-2">
                <Reference id={item.id} />
                <Pill className={SEVERITY_CLASS[item.severity]} title={SEVERITY_MEANS[item.severity]}>
                  {item.severity}
                </Pill>
                <Pill className="bg-gray-700 text-gray-200" title={AREAS[item.area]}>
                  {item.area}
                </Pill>
                {/* An unconfirmed finding is labelled. A guess and a proven fact must not
                    look alike in a list decisions are made from. */}
                {item.verified === false ? (
                  <Pill className="bg-yellow-400 text-black">unconfirmed</Pill>
                ) : null}
              </div>
              <h3 className="text-[17px] font-bold mb-2 leading-snug">{item.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">{item.what}</p>
              {item.status === 'open' ? (
                <div className="flex gap-2 flex-wrap">
                  <Action primary disabled={busy === item.id} onClick={() => onDecide(item, 'approved')}>
                    Approve
                  </Action>
                  <Action disabled={busy === item.id} onClick={() => onDecide(item, 'declined')}>
                    Decline
                  </Action>
                </div>
              ) : (
                <p className="text-gray-400 text-[13px]">
                  {STATUSES[item.status]?.label || item.status}
                </p>
              )}
              <ClaudeActions item={item} busy={busy} onCopy={onCopy} onAsk={onAskClaude} />
            </Card>
          ))}
        </>
      ) : null}

      {/* ---------------- CHECKS ---------------- */}
      {!loading && tab === 'checks' ? (
        <>
          <p className="text-gray-400 text-[13px] leading-relaxed mb-4 max-w-3xl">
            {checksLastRun
              ? `Last recorded run: ${new Date(checksLastRun).toLocaleString()}.`
              : 'No run has been recorded yet, so every check reads "not run".'}
            {' '}A check that has not run is <strong>not</strong> a check that passed.
            {unknown.length ? ` ${unknown.length} of ${checks.length} have never been recorded.` : ''}
          </p>
          {visibleChecks.map((c) => (
            <Card key={c.id}>
              <div className="flex gap-2 flex-wrap mb-2">
                <Pill className={STATE_CLASS[c.state]}>
                  {c.state === 'unknown' ? 'not run' : c.state}
                </Pill>
                <Pill className="bg-gray-700 text-gray-200" title={AREAS[c.area]}>
                  {c.area}
                </Pill>
              </div>
              <h3 className="text-base font-bold mb-1.5 leading-snug">{c.title}</h3>
              {/* What BREAKS if this is wrong -- the reason to care, which a script name
                  never gives. */}
              <p className="text-gray-300 text-[13px] leading-relaxed mb-2.5">{c.protects}</p>
              {c.detail ? (
                <p className="text-orange-400 text-[13px] leading-relaxed mb-2.5">{c.detail}</p>
              ) : null}
              <code className="inline-block text-[13px] text-green-500 bg-green-500/10 px-2 py-1 rounded break-all">
                {c.command}
              </code>
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}
