import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";

const syncViewportHeight = () => {
  const height = Math.floor(
    Math.min(
      document.documentElement.clientHeight || window.innerHeight,
      window.visualViewport?.height || Number.POSITIVE_INFINITY,
    ),
  );

  if (height > 0) {
    document.documentElement.style.setProperty("--app-viewport-height", `${height}px`);
  }
};

syncViewportHeight();
window.addEventListener("resize", syncViewportHeight, { passive: true });
window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);