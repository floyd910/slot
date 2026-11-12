import { useLayoutEffect, useState } from "react";

const LOGO_RATIO = 61 / 258;
const GAP = 10;

const isVisible = (element) =>
  element && element.getClientRects().length > 0 && getComputedStyle(element).display !== "none";

const getFooter = (root) =>
  Array.from(root.querySelectorAll(".footer-block")).find(isVisible) ??
  Array.from(root.querySelectorAll(".bottom-bar")).find(isVisible);

const getFooterBoundaryTop = (_root, footer, fallback) =>
  isVisible(footer) ? footer.getBoundingClientRect().top : fallback;

const getBounds = (root, center) => {
  const ticket = center.querySelector(".grid-bottom-panel");
  // The expanded receipt is an overlay. Its footer keeps the same visual
  // bottom edge as the collapsed ticket, so use that stable footprint while
  // ignoring only the extra receipt content during responsive fitting.
  const ticketFootprint = ticket?.classList.contains("grid-bottom-panel--expanded")
    ? ticket.querySelector(".grid-bottom-panel__footer")
    : ticket;
  const elements = [
    root.querySelector(".main-container__left"), center,
    root.querySelector(".main-container__right"), ticketFootprint,
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
      const areaBounds = area?.getBoundingClientRect();
      const footerTopForReserve = getFooterBoundaryTop(root, footer, areaBounds?.bottom);
      const footerReserve = areaBounds
        ? Math.max(0, areaBounds.bottom - footerTopForReserve)
        : 0;
      const fixedFooterBottom = footer
        ? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top)
        : 0;
      const shortFrame = root.getBoundingClientRect().height <= 620;
      const mobilePortrait = window.matchMedia("(max-width: 639px) and (orientation: portrait)").matches;
      const doubleChestBottom = mobilePortrait && footer?.classList.contains("footer-block-mobile")
        ? fixedFooterBottom
        : footer?.classList.contains("footer-block-mobile")
          ? 200
          : footer?.classList.contains("footer-block-tablet")
            ? 150
            : shortFrame
              ? 50
              : 150;
      root.style.setProperty("--double-chest-bottom", `${doubleChestBottom}px`);
      if (areaBounds) {
        root.style.setProperty("--game-footer-reserve", `${footerReserve}px`);
      }
      if (!area || !logo || !center || root.classList.contains("doubling-active")) return;

      const desktopView1 = root.classList.contains("view-1") &&
        window.matchMedia("(min-width: 1025px)").matches;
      root.dataset.desktopView1Fit = String(desktopView1);
      root.style.removeProperty("--desktop-view1-grid-width");
      root.style.setProperty("--desktop-view1-gap", "20px");
      root.style.setProperty("--desktop-view1-left-shift", "0px");
      root.style.setProperty("--desktop-view1-right-shift", "0px");
      for (const name of ["left", "center", "right"]) {
        root.style.setProperty(`--desktop-view1-${name}-zoom`, "1");
      }
      const areaRect = area.getBoundingClientRect();
      const footerTop = getFooterBoundaryTop(root, footer, areaRect.bottom);
      const compactLandscape = areaRect.width > areaRect.height && areaRect.width <= 1280;
      const logoWidth = compactLandscape
        ? Math.min(420, areaRect.width * 0.5)
        : areaRect.width <= 440
          ? areaRect.width * 0.74
          : Math.min(440, areaRect.width - GAP * 2);
      const logoHeight = logoWidth * LOGO_RATIO;
      const contentTop = Math.max(GAP, logoHeight - headerHeight + GAP);
      root.dataset.fluidFit = "true";
      root.style.setProperty("--fluid-logo-width", `${logoWidth}px`);
      root.style.setProperty("--fluid-logo-height", `${logoHeight}px`);
      root.style.setProperty("--fluid-footer-reserve", `${Math.max(GAP, areaRect.bottom - footerTop + GAP)}px`);
      root.style.setProperty("--fluid-content-scale", "1");
      root.style.setProperty("--fluid-ticket-font-size", "14px");
      root.style.setProperty("--fluid-ticket-min-height", "56px");
      root.style.setProperty("--fluid-ticket-padding", "16px 16px 16px 24px");
      root.style.setProperty("--fluid-ticket-radius", "18px");
      root.style.setProperty("--fluid-ticket-gap", "16px");
      root.style.setProperty("--fluid-ticket-icon-size", "24px");
      root.style.setProperty("--fluid-ticket-mobile-min-height", "52px");
      root.style.setProperty("--fluid-ticket-mobile-padding", "10px 12px");
      root.style.setProperty("--fluid-ticket-mobile-radius", "14px");
      root.style.setProperty("--fluid-ticket-mobile-draw-font-size", "18px");
      root.style.setProperty("--fluid-ticket-mobile-draw-line-height", "22px");
      root.style.setProperty("--fluid-ticket-mobile-text-font-size", "14px");
      root.style.setProperty("--fluid-ticket-mobile-gap", "10px");
      root.style.setProperty("--fluid-ticket-mobile-icon-size", "28px");
      root.style.setProperty("--fluid-ticket-close-inset", "18px");
      root.style.setProperty("--fluid-ticket-offset", "5px");
      root.style.setProperty("--fluid-ticket-grid-correction", "0px");

      let resolvedContentTop = contentTop;
      root.style.setProperty("--fluid-content-top", `${resolvedContentTop}px`);
      root.style.setProperty("--header-content-start", `${resolvedContentTop}px`);

      const activeGrid = center.querySelector(".preloaded-grid-view--active .lottery-grid");
      const activeGridRect = activeGrid?.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const ticketGridCorrection = activeGridRect
        ? Math.max(0, centerRect.bottom - activeGridRect.bottom)
        : 0;
      root.style.setProperty("--fluid-ticket-grid-correction", `${ticketGridCorrection}px`);

      // Use rendered geometry, not only the nominal logo ratio. This catches
      // compact breakpoint transforms that would otherwise pull the grid into
      // the logo layer before the proportional grid fit is calculated.
      let bounds = getBounds(root, center);
      const requiredGridTop = logo.getBoundingClientRect().bottom + GAP;
      if (bounds && bounds.top < requiredGridTop) {
        resolvedContentTop += Math.ceil(requiredGridTop - bounds.top);
        root.style.setProperty("--fluid-content-top", `${resolvedContentTop}px`);
        root.style.setProperty("--header-content-start", `${resolvedContentTop}px`);
        bounds = getBounds(root, center);
      }
      if (!bounds) return;
      const boardElements = [
        root.querySelector(".main-container__left"),
        center,
        root.querySelector(".main-container__right"),
      ].filter(isVisible);
      const boardBottom = Math.max(...boardElements.map((element) => element.getBoundingClientRect().bottom));
      const boardHeight = Math.max(1, boardBottom - bounds.top);
      const compactView2CellHeight = root.classList.contains("view-2") &&
        window.matchMedia("(orientation: portrait) and (max-width: 486px)").matches;
      // Keep the fit scale based on the 207px-row geometry. Otherwise reducing
      // rows to 190px increases the scale and cancels the visible reduction.
      const fittedBoardHeight = boardHeight + (compactView2CellHeight ? 51 : 0);
      const desktopView2CornerTicket = root.classList.contains("view-2") &&
        window.matchMedia("(min-width: 1025px) and (min-height: 761px)").matches;
      const fixedTicketHeight = 0;
      const fixedTicketOffset = 0;
      const availableBoardHeight = footerTop - GAP - fixedTicketHeight - fixedTicketOffset -
        (areaRect.top + resolvedContentTop);
      // View 2 winning-line numbers extend beyond the first and last cells.
      // Progressively increase the side gutter as screens get narrower. This
      // changes only the grid scale; the footer stays full width and wide
      // desktop sizing remains unchanged.
      const mobileView2ExactWidth = root.classList.contains("view-2") && areaRect.width <= 639;
      const horizontalGutter = root.classList.contains("view-2")
        ? areaRect.width <= 440
          ? 72
          : areaRect.width <= 750
            ? 64
            : areaRect.width <= 1280
              ? 56
              : 96
        : GAP;
      const mobileGrid = mobileView2ExactWidth
        ? center.querySelector(".lottery-grid-view2")
        : null;
      const mobileGridWidth = mobileGrid?.getBoundingClientRect().width ?? 0;
      const mobileFooterWidth = footer?.getBoundingClientRect().width ?? areaRect.width;
      // Below 320px, reserve unscaled space for both external winning-line
      // badges, their bridge segments, and glow. The complete View 2
      // composition then shrinks as one unit and remains fully visible.
      const ultraSmallView2Overflow = mobileView2ExactWidth && areaRect.width < 320
        ? 96
        : 0;
      // Each desktop panel uses the full available height. Zoom participates
      // in flex layout, so the grid grows proportionally without overlapping
      // its neighbours. Width is the final limit on unusually tall desktops.
      let desktopScale = null;
      if (desktopView1) {
        const availableHeight = Math.max(1, footerTop - 20 -
          (areaRect.top + resolvedContentTop));
        const panels = boardElements.map((element) => ({
          element,
          rect: element.getBoundingClientRect(),
        }));
        const gap = parseFloat(getComputedStyle(root.querySelector(".frame-content")).columnGap) || 0;
        const grid = panels.find(({ element }) => element === center);
        const sideWidth = panels.reduce((sum, { element, rect }) =>
          sum + (element === center ? 0 : rect.width), 0);
        const gridWidth = Math.max(1, areaRect.width - 40 - sideWidth -
          gap * (panels.length - 1));
        const visibleGridParts = Array.from(center.querySelectorAll(
          ".lottery-grid-view1, .lottery-grid-view1-cell, .win-line-overlay__number"
        )).filter(isVisible).map((element) => element.getBoundingClientRect());
        const overhang = Math.max(0, ...visibleGridParts.flatMap((rect) => [
          grid.rect.left - rect.left, rect.right - grid.rect.right,
        ]));
        const gapCount = panels.length - 1;
        const gridZoom = Math.min(availableHeight / Math.max(1, grid.rect.height),
          gridWidth / Math.max(1, grid.rect.width),
          Math.max(1, areaRect.width - 40 - sideWidth - 20 * gapCount) /
            Math.max(1, grid.rect.width + overhang * gapCount));
        root.style.setProperty("--desktop-view1-gap",
          20 + "px");
        root.style.setProperty("--desktop-view1-center-zoom", String(gridZoom));
        // Preserve the fitted vertical scale; spend the remaining width on cells.
        const fittedGap = 20;
        const maximumGridWidth = Math.max(1,
          areaRect.width - 40 - sideWidth - fittedGap * gapCount);
        root.style.setProperty("--desktop-view1-grid-width",
          maximumGridWidth / Math.max(0.001, gridZoom) + "px");
        root.style.setProperty("--desktop-view1-panel-height", availableHeight + "px");
        root.style.setProperty("--fluid-footer-reserve",
          `${Math.max(20, areaRect.bottom - footerTop + 20)}px`);
        // Keep panels inside the viewport; only the grid yields width.
        const leftPanel = root.querySelector(".main-container__left");
        const rightPanel = root.querySelector(".main-container__right");
        for (let pass = 0; pass < 3; pass += 1) {
          const parts = [center].map((element) => element.getBoundingClientRect());
          const gridLeft = Math.min(...parts.map((rect) => rect.left));
          const gridRight = Math.max(...parts.map((rect) => rect.right));
          const leftRect = isVisible(leftPanel) ? leftPanel.getBoundingClientRect() : null;
          const rightRect = isVisible(rightPanel) ? rightPanel.getBoundingClientRect() : null;
          const gapDeficit = Math.max(0,
            leftRect ? 20 - (gridLeft - leftRect.right) : 0,
            rightRect ? 20 - (rightRect.left - gridRight) : 0);
          const edgeOverflow = Math.max(0,
            leftRect ? areaRect.left + 20 - leftRect.left : 0,
            rightRect ? rightRect.right - (areaRect.right - 20) : 0);
          if (gapDeficit < 0.1 && edgeOverflow < 0.1) break;
          const currentWidth = parseFloat(root.style.getPropertyValue("--desktop-view1-grid-width"));
          const currentGap = parseFloat(root.style.getPropertyValue("--desktop-view1-gap"));
          root.style.setProperty("--desktop-view1-gap", currentGap + gapDeficit + "px");
          root.style.setProperty("--desktop-view1-grid-width",
            Math.max(1, currentWidth - (gapDeficit * gapCount + edgeOverflow * 2) /
              Math.max(0.001, gridZoom)) + "px");
        }
        desktopScale = 1;
      }
      const scale = desktopScale ?? (mobileView2ExactWidth && mobileGridWidth > 0
        ? Math.max(
            0.05,
            mobileFooterWidth / (mobileGridWidth + ultraSmallView2Overflow),
          )
        : Math.max(0.1, Math.min(
            compactLandscape || desktopView2CornerTicket ? Number.POSITIVE_INFINITY : 1,
            (areaRect.width - horizontalGutter * 2) /
              Math.max(1, bounds.right - bounds.left),
            availableBoardHeight / fittedBoardHeight,
          ) * 0.995));
      root.style.setProperty("--fluid-content-scale", String(scale));
      root.style.setProperty("--fluid-ticket-font-size", `${14 / scale}px`);
      root.style.setProperty("--fluid-ticket-min-height", `${56 / scale}px`);
      root.style.setProperty("--fluid-ticket-padding", `${16 / scale}px ${16 / scale}px ${16 / scale}px ${24 / scale}px`);
      root.style.setProperty("--fluid-ticket-radius", `${18 / scale}px`);
      root.style.setProperty("--fluid-ticket-gap", `${16 / scale}px`);
      root.style.setProperty("--fluid-ticket-icon-size", `${24 / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-min-height", `${52 / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-padding", `${10 / scale}px ${12 / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-radius", `${14 / scale}px`);
      const ticketVisualWidth = center.querySelector(".grid-bottom-panel")?.getBoundingClientRect().width || areaRect.width;
      const mobileTicketTextSize = Math.max(9, Math.min(14, ticketVisualWidth * 0.042));
      const mobileTicketDrawSize = Math.max(12, Math.min(18, ticketVisualWidth * 0.055));
      const mobileTicketDrawLineHeight = mobileTicketDrawSize + 3;
      const mobileTicketIconSize = Math.max(20, Math.min(28, ticketVisualWidth * 0.08));
      root.style.setProperty("--fluid-ticket-mobile-draw-font-size", `${mobileTicketDrawSize / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-draw-line-height", `${mobileTicketDrawLineHeight / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-text-font-size", `${mobileTicketTextSize / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-gap", `${10 / scale}px`);
      root.style.setProperty("--fluid-ticket-mobile-icon-size", `${mobileTicketIconSize / scale}px`);
      root.style.setProperty("--fluid-ticket-close-inset", `${18 / scale}px`);
      root.style.setProperty("--fluid-ticket-offset", `${5 / scale}px`);



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
    mountObserver = new MutationObserver((records) => {
      if (records.every(({target}) => (target.nodeType === 1 ? target : target.parentElement)?.closest(".grid-bottom-panel"))) return;
      if (!initialFitStarted || records.some(({ target }) =>
        (target.nodeType === 1 ? target : target.parentElement)?.closest(".payouts"))) scheduleFit();
    });
    mountObserver.observe(root, { childList: true, subtree: true });
    const observer = new ResizeObserver(fit);
    [root, root.parentElement?.querySelector("header"), root.querySelector(".game_area"), root.querySelector(".header_img")]
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
