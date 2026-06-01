// client/vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // <--- ADAUGĂ LINIA ASTA (permite acces din afara containerului)
    port: 5173,
    watch: {
      usePolling: true, // Necesar uneori pe Windows cu Docker pentru hot-reload
    },
  },
});
