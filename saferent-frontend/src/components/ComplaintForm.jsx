import { useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete.jsx";
import { api, ISSUE_TYPES } from "../api/client.js";

const MAX_DESC = 500;

export default function ComplaintForm({ onClose, onSubmitted }) {
  const [location, setLocation] = useState(null); // {address, lat, lng, postal_code_prefix}
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const canSubmit = location && issueType && isAdult && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createComplaint({
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        postal_code_prefix: location.postal_code_prefix || "",
        issue_type: issueType,
        description: description.trim(),
      });
      setDone(true);
      onSubmitted?.(location);
    } catch (e) {
      if (e.status === 429) {
        setError("You've submitted several reports recently. Please try again later.");
      } else if (e.data?.non_field_errors) {
        setError(e.data.non_field_errors[0]);
      } else {
        setError(e.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg font-bold">Report a housing issue</h2>
          <button onClick={onClose} className="rounded p-1 text-ink/50 hover:bg-ink/5" aria-label="Close">
            ✕
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss/15 text-2xl text-moss">
              ✓
            </div>
            <p className="mt-4 font-display text-lg font-bold">Complaint recorded</p>
            <p className="mt-2 text-sm text-ink/70">
              Your anonymous complaint has been recorded. It may take a short while to appear on the map.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-slateblue px-5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
            {/* Address */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Building address</label>
              <AddressAutocomplete onSelect={setLocation} />
              <p className="mt-1 text-xs text-ink/50">Hamilton, ON addresses only.</p>
            </div>

            {/* Issue type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Type of issue</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ISSUE_TYPES).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIssueType(key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      issueType === key
                        ? "border-slateblue bg-slateblue/10 font-medium"
                        : "border-ink/15 hover:border-ink/30"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description <span className="font-normal text-ink/50">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                rows={3}
                placeholder="What's the issue? Avoid naming people. No landlord names."
                className="w-full resize-none rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-slateblue focus:outline-none focus:ring-1 focus:ring-slateblue"
              />
              <p className="mt-1 text-right text-xs text-ink/40">
                {description.length}/{MAX_DESC}
              </p>
            </div>

            {/* 18+ */}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I am 18 or older and understand complaints are public, anonymous, and unverified.
                I will not submit false information or landlord names.
              </span>
            </label>

            {error && (
              <div className="rounded-lg bg-brick/10 px-3 py-2 text-sm text-brick">{error}</div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={onClose} className="px-4 py-2 text-sm text-ink/60 hover:text-ink">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-brick px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit anonymously"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
