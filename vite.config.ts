import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: { enabled: true },
      manifest: {
        id: "/",
        name: "STRIDE Workspace",
        short_name: "STRIDE",
        description: "High-performance, focus-driven project management.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-desktop.png",
            sizes: "1916x904",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/screenshot-mobile.png",
            sizes: "322x695",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ── Security: Production Build Hardening ─────────────────
  build: {
    // Prevent source-map leaks — source maps expose the original
    // TypeScript/React source to anyone with DevTools, enabling
    // reverse-engineering, credential discovery, and attack-surface
    // mapping. Never ship them in production.
    sourcemap: false,

    // esbuild minification options (built into Vite, no Terser needed)
    minify: "esbuild",
  },

  esbuild: {
    // Strip all console.* calls and `debugger` statements in production.
    // This prevents information disclosure (tokens, PII, state dumps)
    // and removes debugging hooks an attacker could exploit.
    ...(mode === "production" && {
      drop: ["console", "debugger"],
    }),
  },
}));
