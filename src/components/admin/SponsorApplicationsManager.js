import React, { useCallback, useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { APPLICATION_STATUS } from "../../services/sponsorApplicationService";
import { SPONSOR_TIERS } from "../../data/sponsorshipTiers";
import { programNameFor } from "../../data/radioStation";
import { buildHandoffZip } from "../../utils/sponsorHandoff";

// The approval desk for radio sponsorships. Approval is the gate that unlocks payment
// -- /advertising shows a pay button only for an application in APPROVED -- so this
// screen is the thing standing between a stranger's audio and BFMG's air.
//
// It also produces the handoff: one ZIP per sponsor, shaped exactly the way the
// station's desk wants it, with the sponsor's ORIGINAL files untouched. The station
// transcodes, normalises, resizes, renames and measures on arrival, so nothing here
// processes anything.

const STATUS_ORDER = [
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.IN_REVIEW,
  APPLICATION_STATUS.APPROVED,
  APPLICATION_STATUS.ACTIVE,
  APPLICATION_STATUS.DECLINED
];

const STATUS_STYLE = {
  [APPLICATION_STATUS.SUBMITTED]: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  [APPLICATION_STATUS.IN_REVIEW]: "bg-blue-900/40 text-blue-300 border-blue-700",
  [APPLICATION_STATUS.APPROVED]: "bg-green-900/40 text-green-300 border-green-700",
  [APPLICATION_STATUS.ACTIVE]: "bg-green-900/60 text-green-200 border-green-600",
  [APPLICATION_STATUS.DECLINED]: "bg-red-900/40 text-red-300 border-red-700"
};

export default function SponsorApplicationsManager() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(collection(db, "sponsorApplications"), orderBy("createdAt", "desc"))
      );
      setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Could not load sponsor applications:", err);
      setError("Could not load applications. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (app, status) => {
    setBusy(app.id);
    setError(null);
    try {
      await updateDoc(doc(db, "sponsorApplications", app.id), {
        status,
        updatedAt: serverTimestamp()
      });
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
    } catch (err) {
      console.error("Could not update application:", err);
      setError("Could not update that application. " + err.message);
    } finally {
      setBusy(null);
    }
  };

  const download = async (app) => {
    setBusy(app.id);
    setError(null);
    try {
      const { blob, filename } = await buildHandoffZip(app);
      // Object URL rather than a data: URL -- a 50MB WAV base64-encodes to ~67MB of
      // string and some browsers refuse a data: URL that size outright.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Handoff packaging failed:", err);
      setError("Could not build the handoff. " + err.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p className="text-gray-400">Loading applications…</p>;

  return (
    <div>
      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {apps.length === 0 ? (
        <p className="text-gray-400">No sponsorship applications yet.</p>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const tier = SPONSOR_TIERS.find((t) => t.id === app.tierId);
            return (
              <div key={app.id} className="bg-gray-800 rounded-lg p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{app.company}</h3>
                    <p className="text-sm text-gray-400">
                      {tier ? tier.name : app.tierId} · {programNameFor(app.programId)} · :{app.spotBlock || "30"}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      STATUS_STYLE[app.status] || "bg-gray-700 text-gray-300 border-gray-600"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
                  <div><dt className="inline text-gray-500">Contact: </dt><dd className="inline text-gray-300">{app.contactName} ({app.email})</dd></div>
                  <div>
                    <dt className="inline text-gray-500">Link: </dt>
                    <dd className="inline">
                      {/* Opened in a new tab so an admin can confirm it resolves. A dead
                          link fails the station's build, and an invented URL is the one
                          advertising fault that has actually reached air there. */}
                      <a href={app.landingUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline break-all">
                        {app.landingUrl}
                      </a>
                    </dd>
                  </div>
                  <div><dt className="inline text-gray-500">Card line: </dt><dd className="inline text-gray-300">{app.blurb}</dd></div>
                  <div><dt className="inline text-gray-500">Button: </dt><dd className="inline text-gray-300">{app.cta}</dd></div>
                  <div><dt className="inline text-gray-500">Audio: </dt><dd className="inline text-gray-300">{app.audio ? "supplied" : app.wantsProduction ? "we produce it" : "none — chase them"}</dd></div>
                  <div><dt className="inline text-gray-500">Logo: </dt><dd className="inline text-gray-300">{app.logo ? "supplied" : "none"}</dd></div>
                </dl>

                {app.describe && (
                  <p className="text-sm text-gray-400 bg-gray-900/50 rounded p-3 mb-4 whitespace-pre-wrap">{app.describe}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.filter((s) => s !== app.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy === app.id}
                      onClick={() => setStatus(app, s)}
                      className="min-h-[44px] px-4 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-full"
                    >
                      Mark {s.replace("_", " ")}
                    </button>
                  ))}

                  {(app.audio || app.logo) && (
                    <button
                      type="button"
                      disabled={busy === app.id}
                      onClick={() => download(app)}
                      className="min-h-[44px] px-5 text-sm font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-full"
                    >
                      {busy === app.id ? "Packaging…" : "Download for the station"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
