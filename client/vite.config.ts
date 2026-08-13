import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/budgetclick-pwa/",

  plugins: [
    vue(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "BudgetClick",
        short_name: "BudgetClick",
        start_url: "/budgetclick-pwa/",
        scope: "/budgetclick-pwa/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f6e56",

        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        navigateFallback: "/budgetclick-pwa/index.html",
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    fs: {
      allow: [".."],
    },
  },
});