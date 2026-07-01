import { useEffect, useState } from "react";

const waitForPaint = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

export function useAssetGate(loadAssets) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    loadAssets()
      .then(waitForPaint)
      .then(() => {
        if (active) setReady(true);
      })
      .catch((assetError) => console.error(assetError));

    return () => {
      active = false;
    };
  }, [loadAssets]);

  return ready;
}