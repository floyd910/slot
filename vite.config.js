import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/soap-hiranmandi": {
        target: "http://5.187.2.138",
        changeOrigin: true,
        rewrite: () => "/soap/SlotHiranmandiSOAP.dll/soap/IInBet",
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
  },
});
