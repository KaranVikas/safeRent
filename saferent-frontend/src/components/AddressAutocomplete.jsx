import { useEffect, useRef, useState } from "react";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
// Bias + restrict results to greater Hamilton (matches backend bbox).
const HAMILTON_BBOX = "-80.25,43.05,-79.55,43.45";
const HAMILTON_PROXIMITY = "-79.8711,43.2557";

/**
 * Calls the Mapbox Geocoding API as the user types and returns a chosen
 * address as { address, lat, lng, postal_code_prefix }.
 */
export default function AddressAutocomplete({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(null);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleChange(value) {
    setQuery(value);
    setChosen(null);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  }

  async function runSearch(value) {
    if (!TOKEN) return;
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json` +
      `?access_token=${TOKEN}&country=ca&types=address` +
      `&bbox=${HAMILTON_BBOX}&proximity=${HAMILTON_PROXIMITY}&limit=5`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.features || []);
      setOpen(true);
    } catch {
      setResults([]);
    }
  }

  function pick(feature) {
    const [lng, lat] = feature.center;
    // Extract postal-code prefix (FSA) if Mapbox provided one in context.
    let prefix = "";
    const pc = (feature.context || []).find((c) => c.id.startsWith("postcode"));
    if (pc?.text) prefix = pc.text.replace(/\s/g, "").slice(0, 3).toUpperCase();

    const selection = {
      address: feature.text + (feature.address ? "" : ""),
      fullPlace: feature.place_name,
      // Prefer the house-number + street form Mapbox gives in place_name's first segment.
      lat,
      lng,
      postal_code_prefix: prefix,
    };
    // Use the most specific street address string available.
    selection.address = feature.place_name.split(",")[0].trim();

    setChosen(selection);
    setQuery(selection.address);
    setOpen(false);
    onSelect(selection);
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Start typing the building address…"
        className="w-full rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-slateblue focus:outline-none focus:ring-1 focus:ring-slateblue"
        autoComplete="off"
      />
      {chosen && (
        <p className="mt-1 text-xs text-moss">✓ {chosen.fullPlace}</p>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink/15 bg-white shadow-lg">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
              >
                <span className="font-medium">{f.place_name.split(",")[0]}</span>
                <span className="block text-xs text-ink/50">
                  {f.place_name.split(",").slice(1).join(",").trim()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
