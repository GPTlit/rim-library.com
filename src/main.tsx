import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any stale or broken service workers to avoid white-screen cache locks on web deployments
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);

