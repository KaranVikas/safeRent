import { useEffect, useState } from "react";
import { api, ISSUE_TYPES } from "../api/client.js";

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

function ComplaintCard({ complaint, onConfirm, onFlag, pending }) {
  const meta = ISSUE_TYPES[complaint.issue_type] || ISSUE_TYPES.other;
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        <span className="font-medium text-sm">{complaint.issue_label}</span>
        <span className="ml-auto text-xs text-ink/50">{timeAgo(complaint.created_at)}</span>
      </div>
      {complaint.description && (
        <p className="mt-2 text-sm text-ink/80 leading-relaxed">{complaint.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button
          onClick={() => onConfirm(complaint.id)}
          disabled={pending}
          className="rounded-full bg-moss/10 px-3 py-1 font-medium text-moss hover:bg-moss/20 disabled:opacity-50"
        >
          Same here · {complaint.confirmation_count}
        </button>
        <button
          onClick={() => onFlag(complaint.id)}
          disabled={pending}
          className="text-ink/40 hover:text-brick disabled:opacity-50"
        >
          Flag as false
        </button>
      </div>
    </div>
  );
}

export default function BuildingPanel({ buildingId, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = () =>
    api.buildingDetail(buildingId).then(setDetail).catch((e) => setError(e.message));

  useEffect(() => {
    setDetail(null);
    setError(null);
    load();
  }, [buildingId]);

  async function handleConfirm(id) {
    setPendingId(id);
    setNotice(null);
    try {
      const { confirmation_count } = await api.confirmComplaint(id);
      setDetail((d) => ({
        ...d,
        complaints: d.complaints.map((c) =>
          c.id === id ? { ...c, confirmation_count } : c
        ),
      }));
    } catch (e) {
      setNotice(e.status === 409 ? "You already confirmed this one." : e.message);
    } finally {
      setPendingId(null);
    }
  }

  async function handleFlag(id) {
    if (!window.confirm("Flag this complaint as false or misleading? It will be hidden pending review.")) return;
    setPendingId(id);
    setNotice(null);
    try {
      await api.flagComplaint(id, "");
      setNotice("Flag received — complaint hidden pending review.");
      await load();
      onChanged?.();
    } catch (e) {
      setNotice(e.status === 409 ? "You already flagged this one." : e.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="absolute right-0 top-0 z-10 flex h-full w-full max-w-md flex-col border-l border-ink/10 bg-paper shadow-xl">
      <div className="flex items-start justify-between border-b border-ink/10 p-4">
        <div>
          {detail ? (
            <>
              <h2 className="font-display text-lg font-bold leading-tight">{detail.address}</h2>
              <p className="text-xs text-ink/60">
                {detail.city}
                {detail.postal_code_prefix ? ` · ${detail.postal_code_prefix}` : ""} ·{" "}
                {detail.complaints.length} visible complaint
                {detail.complaints.length === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <h2 className="font-display text-lg font-bold">Loading…</h2>
          )}
        </div>
        <button onClick={onClose} className="rounded p-1 text-ink/50 hover:bg-ink/5" aria-label="Close">
          ✕
        </button>
      </div>

      {notice && (
        <div className="mx-4 mt-3 rounded bg-slateblue/10 px-3 py-2 text-xs text-slateblue">
          {notice}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {error && <p className="text-sm text-brick">Couldn't load: {error}</p>}

        {detail && Object.keys(detail.breakdown).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(detail.breakdown).map(([type, n]) => {
              const meta = ISSUE_TYPES[type] || ISSUE_TYPES.other;
              return (
                <span
                  key={type}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.label} · {n}
                </span>
              );
            })}
          </div>
        )}

        {detail?.complaints.length === 0 && (
          <p className="text-sm text-ink/50">No visible complaints at this address right now.</p>
        )}

        {detail?.complaints.map((c) => (
          <ComplaintCard
            key={c.id}
            complaint={c}
            onConfirm={handleConfirm}
            onFlag={handleFlag}
            pending={pendingId === c.id}
          />
        ))}
      </div>

      <div className="border-t border-ink/10 p-3 text-center text-[11px] text-ink/40">
        Complaints are unverified and anonymous. Not legal advice.
      </div>
    </div>
  );
}
