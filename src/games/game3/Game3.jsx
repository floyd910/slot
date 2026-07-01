import { useEffect, useState } from "react";
import GameShell from "../../components/game/GameShell.jsx";
import Header from "../../components/header/Header.jsx";
import StartupLoader from "../../components/StartupLoader.jsx";
import { useGameController } from "../../hooks/useGameController.js";
import { preloadStartupAssets } from "../../utils/mediaPreload.js";
import "./Game3.css";

const waitForPaint = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

export default function Game3({ slotId, onBack }) {
  const [assetsReady, setAssetsReady] = useState(false);
  const controller = useGameController(slotId);

  useEffect(() => {
    let active = true;
    preloadStartupAssets()
      .then(waitForPaint)
      .then(() => {
        if (active) setAssetsReady(true);
      })
      .catch((assetError) => {
        console.error(assetError);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!assetsReady) return <StartupLoader ready={false} leaving={false} />;

  return (
    <>
      <Header />
      <GameShell controller={controller} onBackToSlots={onBack} />
    </>
  );
}