import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchLeads,
  LEAD_URGENCY,
  URGENCY_ORDER,
  URGENCY_LABEL
} from "../../services/leadsService";

// Triage across every inbound lead, hottest first.
//
// Enquiries and sponsorship applications live in separate collections and had
// separate admin screens, so "who do I call back first?" could not be answered
// without reading both and holding the comparison in your head. This is the one view
// that answers it. It does not replace those screens -- they are working tools for
// their own workflows -- it sits above them.
//
// Urgency comes from leadsService, not from here, so this screen and the notification
// email cannot disagree about which leads are hot.

const URGENCY_STYLE = {
  [LEAD_URGENCY.HOT]: "bg-red-900/40 text-red-200 border-red-700",
  [LEAD_URGENCY.WARM]: "bg-amber-900/40 text-amber-200 border-amber-700",
  [LEAD_URGENCY.COLD]: "bg-gray-700/50 text-gray-300 border-gray-600"
};

function formatWhen(date) {
  if (!date) return "unknown";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return days + " days ago";
  return date.toLocaleDateString();
}

export default function LeadsManager() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await fetchLeads());
    } catch (err) {
      console.error("Could not load leads:", err);
      setError("Could not load leads. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const tally = { all: leads.length };
    URGENCY_ORDER.forEach((u) => {
      tally[u] = leads.filter((l) => l.urgency === u).length;
    });
    return tally;
  }, [leads]);

  const visible = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.urgency === filter)),
    [leads, filter]
  );

  if (loading) return <p className="text-gray-400">Loading leads…</p>;

  return (
    <div>
      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...URGENCY_ORDER].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`min-h-[44px] px-4 text-sm rounded-full border transition-colors ${
              filter === key
                ? "bg-green-600 border-green-500 text-white"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
            }`}
          >
            {key === "all" ? "All" : URGENCY_LABEL[key]} ({counts[key] || 0})
          </button>
        ))}
        <button
          type="button"
          onClick={load}
          className="min-h-[44px] px-4 text-sm rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600"
        >
          Refresh
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-400">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <div key={lead.id} className="bg-gray-800 rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold">
                    {lead.company || lead.name || "(no name given)"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {lead.topic} · {formatWhen(lead.createdAt)} · {lead.status}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full border ${URGENCY_STYLE[lead.urgency]}`}
                >
                  {URGENCY_LABEL[lead.urgency]}
                </span>
              </div>

              {/* Contact details in full, and reachable in one tap. The point of a
                  triage screen is to act, and making someone copy an address out of a
                  list is how a hot lead becomes a cold one. */}
              <div className="text-sm mb-3">
                <p className="text-gray-300">{lead.name}</p>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="inline-flex items-center min-h-[44px] text-green-500 hover:underline break-all">
                    {lead.email}
                  </a>
                )}
              </div>

              {lead.extras && lead.extras.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                  {lead.extras
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt className="inline text-gray-500">{label}: </dt>
                        <dd className="inline text-gray-300 break-all">{value}</dd>
                      </div>
                    ))}
                </dl>
              )}

              {lead.detail && (
                <p className="text-sm text-gray-400 bg-gray-900/50 rounded p-3 whitespace-pre-wrap">
                  {lead.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
