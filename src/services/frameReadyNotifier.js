export const notifySlotChooserReady = () => {
  if (window.parent === window) return;

  let targetOrigin = "*";
  try {
    targetOrigin = document.referrer ? new URL(document.referrer).origin : "*";
  } catch {
    targetOrigin = "*";
  }

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