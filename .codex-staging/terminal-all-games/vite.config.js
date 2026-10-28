import { defineConfig } from "vite";
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

export default defineConfig({
  plugins: [react(), immutableAssetCache()],
  build: { sourcemap: false, minify: "esbuild" },
  esbuild: { drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [] },
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/soap-terminal-ganchina": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotGanchinaSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-terminal-mavrodir": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotMavrodirSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-hiranmandi-terminal": {
        target: "https://betproduct-admin.com",
        changeOrigin: true,
        secure: true,
        timeout: 60000,
        proxyTimeout: 60000,
        headers: { Connection: "close" },
        rewrite: () => "/soap//SlotHiranmandiSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-terminal-egipt2": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotEgipt2SOAPTerminal.dll/soap/IInBet",
      },
      "/soap-terminal-kadimi": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotKadimiSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-terminal-hocha": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotHochaSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-terminal-babilon": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotBabilonSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-terminal-fruct": {
        target: "https://betproduct-admin.com", changeOrigin: true, secure: true,
        timeout: 60000, proxyTimeout: 60000, headers: { Connection: "close" },
        rewrite: () => "/soap//SlotFructSOAPTerminal.dll/soap/IInBet",
      },
      "/soap-hiranmandi": {
        target: "http://5.187.2.138",
        changeOrigin: true,
        rewrite: () => "/soap/SlotHiranmandiSOAPFrame.dll/soap/IInBet",
      },
    },
  },
  preview: { host: "0.0.0.0", port: 4174 },
});
