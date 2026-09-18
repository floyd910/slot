import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = {...loadEnv(mode, process.cwd(), ""), ...process.env};
  return {
  plugins: [react()],
  // Public demo account only. These two values are intentionally included in the client build.
  define: {
    'import.meta.env.VITE_DEMO_TOKEN': JSON.stringify(env.DEMO_TOKEN || ''),
    'import.meta.env.VITE_DEMO_PLAYER_ID': JSON.stringify(env.DEMO_PLAYER_ID || ''),
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
