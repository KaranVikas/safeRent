import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import BuildingPanel from "./components/BuildingPanel.jsx";
import ComplaintForm from "./components/ComplaintForm.jsx";
import Footer from "./components/Footer.jsx";
import { FAQ, Disclaimer, Privacy, Terms } from "./components/Pages.jsx";
import { api } from "./api/client.js";

function ApiStatus() {
  const [state, setState] = useState("checking");
  useEffect(() => {
    api.health().then((d) => setState(d.db ? "ok" : "down")).catch(() => setState("down"));
  }, []);
  const dot = state === "ok" ? "bg-moss" : state === "down" ? "bg-brick" : "bg-ink/30";
  const label = state === "ok" ? "API connected" : state === "down" ? "API offline" : "Checking API…";
  return (
    <span className="flex items-center gap-2 text-xs text-ink/60">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// Tiny hash router: avoids pulling in react-router for 4 static pages.
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

const PAGES = {
  "#/faq": FAQ,
  "#/disclaimer": Disclaimer,
  "#/privacy": Privacy,
  "#/terms": Terms,
};

export default function App() {
  const route = useHashRoute();
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [flyTo, setFlyTo] = useState(null);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  function handleSubmitted(location) {
    setFlyTo({ lng: location.lng, lat: location.lat, t: Date.now() });
    bumpRefresh();
  }

  const StaticPage = PAGES[route];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-4 py-3">
        <a href="#/" className="block">
          <h1 className="font-display text-xl font-extrabold tracking-tight">SafeRent</h1>
          <p className="text-xs text-ink/60">
            Hamilton housing complaints — anonymous, aggregated, retaliation-free
          </p>
        </a>
        <ApiStatus />
      </header>

      {StaticPage ? (
        <div className="flex-1 overflow-y-auto">
          <StaticPage />
          <Footer />
        </div>
      ) : (
        <>
          <main className="relative flex-1">
            <MapView onSelectBuilding={setSelectedId} refreshKey={refreshKey} flyTo={flyTo} />

            <div className="pointer-events-none absolute left-3 top-3 z-[5] max-w-[60%] rounded-lg bg-white/90 px-3 py-2 text-xs text-ink/70 shadow">
              Numbered pins show complaints per building. Tap one for details.
            </div>

            <button
              onClick={() => setFormOpen(true)}
              className="absolute bottom-6 right-6 z-[5] rounded-full bg-brick px-5 py-3 font-display text-sm font-bold text-white shadow-lg hover:opacity-90"
            >
              + Report an issue
            </button>

            {selectedId && (
              <BuildingPanel
                buildingId={selectedId}
                onClose={() => setSelectedId(null)}
                onChanged={bumpRefresh}
              />
            )}

            {formOpen && (
              <ComplaintForm onClose={() => setFormOpen(false)} onSubmitted={handleSubmitted} />
            )}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
