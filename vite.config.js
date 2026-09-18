import { demoLaunchPlugin } from "./server/demoLaunchPlugin.js";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react(), demoLaunchPlugin(loadEnv(mode, process.cwd(), ""))],
  build: {
    sourcemap: false,
    minify: "esbuild",
  },
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/soap-hiranmandi": {
        target: "http://5.187.2.138",
        changeOrigin: true,
        rewrite: () => "/soap/SlotHiranmandiSOAPFrame.dll/soap/IInBet",
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
  },
}));
