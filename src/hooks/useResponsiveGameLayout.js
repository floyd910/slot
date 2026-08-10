import { useLayoutEffect, useState } from "react";

const LOGO_RATIO = 61 / 258;
const GAP = 10;

const isVisible = (element) =>
  element && element.getClientRects().length > 0 && getComputedStyle(element).display !== "none";

const getFooter = (root) =>
  Array.from(root.querySelectorAll(".footer-block")).find(isVisible) ??
  Array.from(root.querySelectorAll(".bottom-bar")).find(isVisible);

const getBounds = (root, center) => {
  const ticket = center.querySelector(".grid-bottom-panel:not(.grid-bottom-panel--expanded)");
  const elements = [
    root.querySelector(".main-container__left"), center,
    root.querySelector(".main-container__right"), ticket,
  ].filter(isVisible);
  if (!elements.length) return null;
  const rects = elements.map((element) => element.getBoundingClientRect());
  return {
    top: Math.min(...rects.map((rect) => rect.top)),
    left: Math.min(...rects.map((rect) => rect.left)),
    right: Math.max(...rects.map((rect) => rect.right)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
  };
};

export function useResponsiveGameLayout(rootRef, layoutMode) {
  const [layoutReady, setLayoutReady] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let frame = 0;
    let readyFrame = 0;
    let initialFitStarted = false;
    let mountObserver;

    const fit = () => {
      frame = 0;
      const area = root.querySelector(".game_area");
      const logo = root.querySelector(".header_img");
      const center = root.querySelector(".main-container__center");
      const footer = getFooter(root);
      const header = root.parentElement?.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height || 48;
      root.style.setProperty("--game-header-height", `${headerHeight}px`);
      const shortFrame = root.getBoundingClientRect().height <= 620;
      const doubleChestBottom = footer?.classList.contains("footer-block-mobile")
        ? 200
        : footer?.classList.contains("footer-block-tablet")
          ? 150
          : shortFrame
            ? 50
            : 150;
      root.style.setProperty("--double-chest-bottom", `${doubleChestBottom}px`);
      if (area) {
        const areaBounds = area.getBoundingClientRect();
        const footerTop = footer?.getBoundingClientRect().top ?? areaBounds.bottom;
        root.style.setProperty(
          "--game-footer-reserve",
          `${Math.max(0, areaBounds.bottom - footerTop)}px`,
        );
      }
      if (!area || !logo || !center || root.classList.contains("doubling-active")) return;

      const areaRect = area.getBoundingClientRect();
      const footerTop = footer?.getBoundingClientRect().top ?? areaRect.bottom;
      const compactLandscape = areaRect.width > areaRect.height && areaRect.width <= 1024;
      const logoWidth = compactLandscape
        ? Math.min(260, areaRect.width * 0.4)
        : areaRect.width <= 440
          ? areaRect.width * 0.8
          : Math.min(440, areaRect.width - GAP * 2);
      const logoHeight = logoWidth * LOGO_RATIO;
      root.dataset.fluidFit = "true";
      root.style.setProperty("--fluid-logo-width", `${logoWidth}px`);
      root.style.setProperty("--fluid-logo-height", `${logoHeight}px`);
      root.style.setProperty("--fluid-footer-reserve", `${Math.max(GAP, areaRect.bottom - footerTop + GAP)}px`);
      root.style.setProperty("--header-content-start", `${logoHeight + GAP}px`);
      root.style.setProperty("--fluid-content-scale", "1");

      const bounds = getBounds(root, center);
      if (!bounds) return;
      const scale = Math.max(0.1, Math.min(
        1,
        (areaRect.width - GAP * 2) / Math.max(1, bounds.right - bounds.left),
        (footerTop - GAP - (areaRect.top + logoHeight + GAP)) / Math.max(1, bounds.bottom - bounds.top),
      ) * 0.995);
      root.style.setProperty("--fluid-content-scale", String(scale));

      // Verify the committed grid against the exact logo/footer boundaries in this same pass.
      const fittedBounds = getBounds(root, center);
      if (fittedBounds) {
        const fittedWidth = Math.max(1, fittedBounds.right - fittedBounds.left);
        const fittedHeight = Math.max(1, fittedBounds.bottom - fittedBounds.top);
        const availableHeight = footerTop - GAP - (areaRect.top + logoHeight + GAP);
        const overlapCorrection = Math.min(
          1,
          (areaRect.width - GAP * 2) / fittedWidth,
          availableHeight / fittedHeight,
        );
        if (overlapCorrection < 0.999) {
          root.style.setProperty(
            "--fluid-content-scale",
            String(scale * overlapCorrection * 0.995),
          );
        }
      }

      if (!initialFitStarted) {
        initialFitStarted = true;
        // The loader remains opaque while CSS commits, then this final pass reads committed geometry.
        readyFrame = requestAnimationFrame(() => {
          readyFrame = requestAnimationFrame(() => {
            fit();
            mountObserver?.disconnect();
            setLayoutReady(true);
          });
        });
      }
    };
    const scheduleFit = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    mountObserver = new MutationObserver(() => {
      if (!initialFitStarted) scheduleFit();
    });
    mountObserver.observe(root, { childList: true, subtree: true });
    const observer = new ResizeObserver(fit);
    [root, root.parentElement?.querySelector("header"), root.querySelector(".game_area"), root.querySelector(".bottom-bar")]
      .filter(Boolean).forEach((element) => observer.observe(element));
    window.addEventListener("resize", fit, { passive: true });
    document.addEventListener("fullscreenchange", fit);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (readyFrame) cancelAnimationFrame(readyFrame);
      observer.disconnect();
      mountObserver?.disconnect();
      window.removeEventListener("resize", fit);
      document.removeEventListener("fullscreenchange", fit);
    };
  }, [rootRef, layoutMode]);

  return layoutReady;
}