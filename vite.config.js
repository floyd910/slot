import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
const IMMUTABLE_ASSET_PATH = /^\/(?:assets|media|img)\//;
const immutableAssetCache = () => {
  const applyHeaders = (server) => {
    server.middlewares.use((request, response, next) => {
      const pathname = String(request.url ?? "").split("?", 1)[0];
      if (IMMUTABLE_ASSET_PATH.test(pathname)) {
        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
      next();
    });
  };
  return {
    name: "immutable-static-asset-cache",
    configureServer: applyHeaders,
    configurePreviewServer: applyHeaders,
  };
};

export default defineConfig(({ mode }) => {
  const env = {...loadEnv(mode, process.cwd(), ""), ...process.env};
  return {
  plugins: [react(), immutableAssetCache()],
  // Browser profiles and preview HTML under tmp/tools are not app entries.
  optimizeDeps: { entries: ["index.html"] },
  // Public demo account only. The token is intentionally included in the client build.
  define: {
    'import.meta.env.VITE_DEMO_TOKEN': JSON.stringify(env.DEMO_TOKEN || ''),
  },
  build: { sourcemap: false, minify: "esbuild" },
  esbuild: { drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [] },
  server: {
    host: "0.0.0.0", port: 5174,
    proxy: {
      "/soap-hiranmandi": {
        target: "http://5.187.2.138", changeOrigin: true,
        rewrite: () => "/soap/SlotHiranmandiSOAPFrame.dll/soap/IInBet",
      },
    },
  },
  preview: { host: "0.0.0.0", port: 4174 },
};
});
