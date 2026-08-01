import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";

let compactLayoutFrame;

const getViewportSize = () => {
  const root = document.documentElement;
  const layoutWidth = root.clientWidth || window.innerWidth;
  const layoutHeight = root.clientHeight || window.innerHeight;
  const visualViewport = window.visualViewport;

  return {
    width: Math.floor(
      visualViewport?.width
        ? Math.min(layoutWidth, visualViewport.width)
        : layoutWidth,
    ),
    height: Math.floor(
      visualViewport?.height
        ? Math.min(layoutHeight, visualViewport.height)
        : layoutHeight,
    ),
  };
};
let layoutDefaults = {
  headerScale: 1,
  view1Scale: 1,
  view2Scale: 1,
};

const fitCompactLandscape = () => {
  window.cancelAnimationFrame(compactLayoutFrame);
  compactLayoutFrame = window.requestAnimationFrame(() => {
    const viewport = getViewportSize();
    const shell = document.querySelector(".frame-app");
    const isLandscape = viewport.width > viewport.height;
    if (
      !shell ||
      shell.classList.contains("doubling-active") ||
      (!isLandscape && viewport.width < 761)
    ) {
      return;
    }

    const isCompactLandscape =
      viewport.width > viewport.height && viewport.height <= 620;

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
    const baseScale = isCompactLandscape
      ? isView2
        ? layoutDefaults.view2Scale
        : layoutDefaults.view1Scale
      : 1;
    const baseHeaderScale = isCompactLandscape
      ? 1
      : layoutDefaults.headerScale;
    document.documentElement.style.setProperty(scaleProperty, baseScale);
    document.documentElement.style.setProperty(
      "--responsive-header-scale",
      baseHeaderScale,
    );
    document.documentElement.style.setProperty(
      shiftProperty,
      `${baseShift}px`,
    );
    const grid = center.querySelector(".lottery-grid");
    const intrinsicHeight =
      isCompactLandscape && !isView2 && grid
        ? grid.offsetTop + grid.offsetHeight
        : center.offsetHeight;
    const intrinsicWidth =
      isCompactLandscape && !isView2 && grid ? grid.offsetWidth : center.offsetWidth;
    if (!intrinsicHeight || !intrinsicWidth || !Number.isFinite(baseScale)) return;

    const headerRect = headerImage.getBoundingClientRect();
    const footerTop = footer.getBoundingClientRect().top;
    const centerTop = center.getBoundingClientRect().top;
    const preferredMinimumScale = isCompactLandscape
      ? Math.min(baseScale, isView2 ? 0.54 : 0.38)
      : 0.78;
    const preferredTop = Math.max(centerTop, headerRect.bottom + 12);
    const preferredSpace = footerTop - preferredTop - 12;

    if (preferredSpace < intrinsicHeight * preferredMinimumScale) {
      const targetHeaderBottom =
        footerTop - 24 - intrinsicHeight * preferredMinimumScale;
      const targetHeaderHeight = Math.max(
        headerRect.height * 0.45,
        targetHeaderBottom - headerRect.top,
      );
      document.documentElement.style.setProperty(
        "--responsive-header-scale",
        Math.min(1, targetHeaderHeight / headerRect.height),
      );
    }

    const fittedHeaderBottom = headerImage.getBoundingClientRect().bottom;
      const fittedCenterTop = center.getBoundingClientRect().top;
      const requiredTop = fittedHeaderBottom + 12;
      const fittedTop = Math.max(fittedCenterTop, requiredTop);
      const availableHeight = Math.max(0, footerTop - fittedTop - 12);
      const fittedScale = isCompactLandscape
        ? Math.min(
            availableHeight / intrinsicHeight,
            (viewport.width - 24) / intrinsicWidth,
          )
        : Math.min(baseScale, availableHeight / intrinsicHeight);

      document.documentElement.style.setProperty(
        scaleProperty,
        Math.max(0.1, fittedScale),
      );
      document.documentElement.style.setProperty(
        shiftProperty,
        `${baseShift + Math.max(0, requiredTop - fittedCenterTop)}px`,
      );

      const useCompactSidePanels =
        !isView2 &&
        isLandscape &&
        viewport.width >= 1024 &&
        viewport.width <= 1280;

      if (useCompactSidePanels) {
        const renderedGridWidth = center.getBoundingClientRect().width;
        const renderedGridHeight = center.getBoundingClientRect().height;
        const sidePanelScale = Math.max(
          0.2,
          Math.min(1, (viewport.width - renderedGridWidth) / 696),
        );

        document.documentElement.style.setProperty(
          "--large-side-panel-scale",
          sidePanelScale,
        );        document.documentElement.style.setProperty(
          "--miniature-row-gap",
          `${Math.round(32 * sidePanelScale)}px`,
        );
        document.documentElement.style.setProperty(
          "--side-panel-max-height",
          `${renderedGridHeight / sidePanelScale}px`,
        );
      } else if (!isCompactLandscape) {
        const sidePanels = [
          shell.querySelector(".main-container__left"),
          shell.querySelector(".main-container__right"),
        ].filter(Boolean);
        const sidePanelScale = sidePanels.reduce((scale, panel) => {
          const panelHeight = panel.offsetHeight;
          if (!panelHeight) return scale;

          const availablePanelHeight =
            footerTop - panel.getBoundingClientRect().top - 12;
          return Math.min(scale, availablePanelHeight / panelHeight);
        }, 1);

        document.documentElement.style.setProperty(
          "--large-side-panel-scale",
          Math.max(0.1, sidePanelScale),
        );
      }
  });
};
const syncAppViewportHeight = () => {
  const viewport = getViewportSize();
  const usableViewportHeight = viewport.height;

  if (usableViewportHeight > 0) {
    const compactSidePanelScale =
      viewport.width > viewport.height &&
      viewport.width >= 1024 &&
      viewport.width <= 1280
        ? 0.5
        : 1;
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
    layoutDefaults = {
      headerScale,
      view1Scale,
      view2Scale,
    };

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
    );    document.documentElement.style.setProperty(
      "--large-side-panel-scale",
      compactSidePanelScale,
    );    document.documentElement.style.setProperty(
      "--miniature-row-gap",
      `${Math.round(32 * compactSidePanelScale)}px`,
    );
    document.documentElement.style.setProperty(
      "--responsive-header-scale",
      viewport.width > viewport.height && usableViewportHeight <= 620
        ? 1
        : headerScale,
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
let doubleEntryViewportKey = "";
const fitWhenLayoutModeChanges = () => {
  const shell = document.querySelector(".frame-app");
  if (!shell) return;

  const layoutMode = `${shell.classList.contains("view-2") ? "view-2" : "view-1"}:${shell.classList.contains("doubling-active") ? "double" : "normal"}`;
  if (layoutMode === lastLayoutMode) return;

  const previousLayoutMode = lastLayoutMode;
  lastLayoutMode = layoutMode;

  const viewport = getViewportSize();
  const viewportKey = `${viewport.width}x${viewport.height}`;
  const enteredDoubling = !previousLayoutMode.endsWith(":double") && layoutMode.endsWith(":double");
  const exitedDoubling = previousLayoutMode.endsWith(":double") && layoutMode.endsWith(":normal");

  if (enteredDoubling) {
    doubleEntryViewportKey = viewportKey;
    return;
  }

  // The authored scale is already correct when the viewport did not change.
  // Re-fitting while View 2 is remounting measures transitional, smaller geometry.
  if (exitedDoubling && viewportKey === doubleEntryViewportKey) {
    return;
  }

  fitCompactLandscape();
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
