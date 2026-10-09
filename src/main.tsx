import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for aggressive caching, instant image loading, and offline capability
if ("serviceWorker" in navigator && !window.location.host.includes("localhost:3000")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Automatically check for SW updates
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.warn("ServiceWorker registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

