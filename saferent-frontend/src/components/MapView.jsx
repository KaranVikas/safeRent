import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

const HAMILTON_CENTER = [-79.8711, 43.2557]; // lng, lat
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!TOKEN || TOKEN.startsWith("pk.your")) {
      setMapError("missing-token");
      return;
    }
    if (mapRef.current) return; // guard against React 18 StrictMode double-mount

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: HAMILTON_CENTER,
      zoom: 12,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => {
      if (e?.error?.status === 401) setMapError("bad-token");
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-paper">
        <div className="max-w-md rounded-lg border border-ink/10 bg-white p-6 text-sm leading-relaxed">
          <p className="font-display text-lg font-bold">Map needs a Mapbox token</p>
          <p className="mt-2">
            {mapError === "bad-token"
              ? "The token in frontend/.env was rejected by Mapbox. Check it was copied fully."
              : "Create frontend/.env (copy from .env.example) and paste your token:"}
          </p>
          <pre className="mt-3 rounded bg-ink/5 p-3 text-xs">VITE_MAPBOX_TOKEN=pk.…</pre>
          <p className="mt-2 text-ink/60">
            Free token at account.mapbox.com → restart <code>npm run dev</code> after saving.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
