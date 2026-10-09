import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Backend connection values. These are publishable (safe in the browser) and are
// used as fallbacks so a build on GitHub/Netlify still works if the environment
// variables were not configured there.
const FALLBACK_SUPABASE_URL = "https://lpgcuygtusqtctduwofb.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZ2N1eWd0dXNxdGN0ZHV3b2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDk1NTEsImV4cCI6MjA4MTIyNTU1MX0.S_RUgR5sq1MgLc-klffDHg7dpoXl7tvom_jlZqyJeWM";
const FALLBACK_SUPABASE_PROJECT_ID = "lpgcuygtusqtctduwofb";

// Copy index.html to 404.html so GitHub Pages serves the app on deep links.
const spaFallback = () => ({
  name: "spa-404-fallback",
  closeBundle() {
    const dist = path.resolve(__dirname, "dist");
    const index = path.join(dist, "index.html");
    if (fs.existsSync(index)) fs.copyFileSync(index, path.join(dist, "404.html"));
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [react(), spaFallback()].filter(Boolean),
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || FALLBACK_SUPABASE_PROJECT_ID
    ),
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/@tanstack/react-query/")) {
            return "vendor-query";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
