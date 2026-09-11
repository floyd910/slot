import { resolveParentOrigin } from "../api/frameLaunch.js";
import { getFrontendEnvConfig } from "../api/runtimeConfig.js";
export const notifySlotChooserReady = () => {
  if (window.parent === window) return;

  const allowedOrigins = (getFrontendEnvConfig().parentOrigins ?? "").split(",").map(v => v.trim());
  const targetOrigin = resolveParentOrigin(allowedOrigins, document.referrer, true);
  if (!targetOrigin) return;

  window.parent.postMessage(
    {
      source: "hiranmandi-iframe",
      contractVersion: "1.0",
      type: "SLOT_CHOOSER_READY",
      payload: { assetsReady: true },
      meta: {
        timestamp: new Date().toISOString(),
        viewportWidth: window.innerWidth,
      },
    },
    targetOrigin,
  );
};