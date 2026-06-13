import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { api } from "../api/client.js";

const HAMILTON_CENTER = [-79.8711, 43.2557];
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ onSelectBuilding, refreshKey, flyTo }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const debounceRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const fetchPins = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    let buildings = [];
    try {
      buildings = await api.buildings(bbox);
    } catch {
      return;
    }
    const seen = new Set();
    for (const bld of buildings) {
      seen.add(bld.id);
      if (markersRef.current.has(bld.id)) {
        markersRef.current.get(bld.id).getElement().querySelector(".pin-count").textContent = bld.complaint_count;
        continue;
      }
      const el = document.createElement("button");
      el.className = "pin";
      el.innerHTML = `<span class="pin-count">${bld.complaint_count}</span>`;
      el.addEventListener("click", (e) => { e.stopPropagation(); onSelectBuilding(bld.id); });
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([bld.lng, bld.lat]).addTo(map);
      markersRef.current.set(bld.id, marker);
    }
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) { marker.remove(); markersRef.current.delete(id); }
    }
  }, [onSelectBuilding]);

  const debouncedFetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPins, 350);
  }, [fetchPins]);

  useEffect(() => {
    if (!TOKEN || TOKEN.startsWith("pk.your")) { setMapError("missing-token"); return; }
    if (mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: HAMILTON_CENTER, zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => { if (e?.error?.status === 401) setMapError("bad-token"); });
    map.on("load", () => { setLoaded(true); fetchPins(); });
    map.on("moveend", debouncedFetch);
    mapRef.current = map;
    return () => {
      clearTimeout(debounceRef.current);
      map.remove(); mapRef.current = null; markersRef.current.clear();
    };
  }, [fetchPins, debouncedFetch]);

  useEffect(() => { if (loaded) fetchPins(); }, [refreshKey, loaded, fetchPins]);

  useEffect(() => {
    if (loaded && flyTo && mapRef.current) {
      mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 15, duration: 1200 });
    }
  }, [flyTo, loaded]);

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-paper">
        <div className="max-w-md rounded-lg border border-ink/10 bg-white p-6 text-sm leading-relaxed">
          <p className="font-display text-lg font-bold">Map needs a Mapbox token</p>
          <p className="mt-2">{mapError === "bad-token"
            ? "The token in frontend/.env was rejected by Mapbox."
            : "Create frontend/.env (copy .env.example) and paste your token:"}</p>
          <pre className="mt-3 rounded bg-ink/5 p-3 text-xs">VITE_MAPBOX_TOKEN=pk.…</pre>
        </div>
      </div>
    );
  }
  return <div ref={containerRef} className="h-full w-full" />;
}
