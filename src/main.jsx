import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";

let compactLayoutFrame;

const fitCompactLandscape = () => {
  window.cancelAnimationFrame(compactLayoutFrame);
  compactLayoutFrame = window.requestAnimationFrame(() => {
    const shell = document.querySelector(".frame-app");
    if (
      !shell ||
      shell.classList.contains("doubling-active") ||
      (window.innerHeight > 620 && window.innerWidth < 761)
    ) {
      return;
    }

    const isCompactLandscape =
      window.innerWidth > window.innerHeight && window.innerHeight <= 620;

    const headerImage = shell.querySelector(".header_img");
    const footer = shell.querySelector(".bottom-bar");
    const center = shell.querySelector(".main-container__center");
    if (!headerImage || !footer || !center) return;

    const isView2 = shell.classList.contains("view-2");
    const scaleProperty = isCompactLandscape
      ? isView2
        ? "--compact-view2-grid-scale"
        : "--compact-view1-grid-scale"
      : "--large-surface-grid-scale";
    const shiftProperty = isCompactLandscape
      ? isView2
        ? "--compact-view2-frame-shift"
        : "--compact-view1-frame-shift"
      : "--large-surface-frame-shift";
    const baseShift = isCompactLandscape ? (isView2 ? -95 : -70) : 0;
    const baseScale = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(scaleProperty),
    );
    const intrinsicHeight = center.offsetHeight;
    if (!intrinsicHeight || !Number.isFinite(baseScale)) return;

    const footerTop = footer.getBoundingClientRect().top;

    window.requestAnimationFrame(() => {
      const fittedHeaderBottom =
        headerImage.getBoundingClientRect().bottom;
      const fittedCenterTop = center.getBoundingClientRect().top;
      const requiredTop = fittedHeaderBottom + 12;
      const fittedTop = Math.max(fittedCenterTop, requiredTop);
      const availableHeight = Math.max(0, footerTop - fittedTop - 12);
      const fittedScale = Math.min(
        baseScale,
        availableHeight / intrinsicHeight,
      );

      document.documentElement.style.setProperty(
        scaleProperty,
        Math.max(0.1, fittedScale),
      );
      document.documentElement.style.setProperty(
        shiftProperty,
        `${baseShift + Math.max(0, requiredTop - fittedCenterTop)}px`,
      );
    });
  });
};
const syncAppViewportHeight = () => {
  const iframeViewportHeight = document.documentElement.clientHeight;
  const visualViewportHeight =
    window.visualViewport?.height ?? iframeViewportHeight;
  const usableViewportHeight = Math.floor(
    Math.min(iframeViewportHeight, visualViewportHeight),
  );

  if (usableViewportHeight > 0) {
    const headerScale =
      usableViewportHeight >= 580
        ? 1
        : usableViewportHeight >= 500
          ? 0.95
          : usableViewportHeight >= 430
            ? 0.9
            : usableViewportHeight >= 400
              ? 0.84
              : usableViewportHeight >= 375
                ? 0.78
                : 0.72;
    const [view1Scale, view2Scale] =
      usableViewportHeight >= 580
        ? [0.6, 0.72]
        : usableViewportHeight >= 500
          ? [0.54, 0.69]
          : usableViewportHeight >= 430
            ? [0.48, 0.65]
            : usableViewportHeight >= 400
              ? [0.43, 0.6]
              : usableViewportHeight >= 375
                ? [0.42, 0.58]
                : [0.4, 0.56];

    document.documentElement.style.setProperty(
      "--app-viewport-height",
      `${usableViewportHeight}px`,
    );
    document.documentElement.style.setProperty(
      "--compact-view1-grid-scale",
      view1Scale,
    );
    document.documentElement.style.setProperty(
      "--compact-view2-grid-scale",
      view2Scale,
    );
    document.documentElement.style.setProperty(
      "--compact-view1-frame-shift",
      "-70px",
    );
    document.documentElement.style.setProperty(
      "--compact-view2-frame-shift",
      "-95px",
    );
    document.documentElement.style.setProperty(
      "--large-surface-grid-scale",
      "1",
    );
    document.documentElement.style.setProperty(
      "--large-surface-frame-shift",
      "0px",
    );
    document.documentElement.style.setProperty(
      "--responsive-header-scale",
      headerScale,
    );
    fitCompactLandscape();
  }
};

syncAppViewportHeight();
window.addEventListener("resize", syncAppViewportHeight, { passive: true });
window.visualViewport?.addEventListener("resize", syncAppViewportHeight, {
  passive: true,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
let lastLayoutMode = "";
const fitWhenLayoutModeChanges = () => {
  const shell = document.querySelector(".frame-app");
  if (!shell) return;

  const layoutMode = `${shell.classList.contains("view-2") ? "view-2" : "view-1"}:${shell.classList.contains("doubling-active") ? "double" : "normal"}`;
  if (layoutMode === lastLayoutMode) return;

  lastLayoutMode = layoutMode;
  syncAppViewportHeight();
};

new MutationObserver(fitWhenLayoutModeChanges).observe(
  document.getElementById("root"),
  {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  },
);

fitWhenLayoutModeChanges();
