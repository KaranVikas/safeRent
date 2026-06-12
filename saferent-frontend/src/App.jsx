import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import { api } from "./api/client.js";

function ApiStatus() {
  const [state, setState] = useState("checking"); // checking | ok | down

  useEffect(() => {
    api
      .health()
      .then((d) => setState(d.db ? "ok" : "down"))
      .catch(() => setState("down"));
  }, []);

  const dot =
    state === "ok" ? "bg-moss" : state === "down" ? "bg-brick" : "bg-ink/30";
  const label =
    state === "ok" ? "API connected" : state === "down" ? "API offline" : "Checking API…";

  return (
    <span className="flex items-center gap-2 text-xs text-ink/60">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-4 py-3">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            SafeRent
          </h1>
          <p className="text-xs text-ink/60">
            Hamilton housing complaints — anonymous, aggregated, retaliation-free
          </p>
        </div>
        <ApiStatus />
      </header>

      <main className="relative flex-1">
        <MapView />
      </main>
    </div>
  );
}
