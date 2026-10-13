import { useLayoutEffect, useState } from "react";

const LOGO_RATIO = 61 / 258;
const GAP = 10;

const isVisible = (element) =>
  element && element.getClientRects().length > 0 && getComputedStyle(element).display !== "none";

const getFooter = (root) =>
  Array.from(root.querySelectorAll(".footer-block")).find(isVisible) ??
  Array.from(root.querySelectorAll(".bottom-bar")).find(isVisible);

const getFooterBoundaryTop = (root, footer, fallback) => {
  const boundaries = [footer, root.querySelector(".mobile-info-row")]
    .filter(isVisible)
    .map((element) => element.getBoundingClientRect().top);
  return boundaries.length ? Math.min(...boundaries) : fallback;
};

const getBounds = (root, center) => {
  const ticket = center.querySelector(".grid-bottom-panel");
  // Only the collapsed footer is part of fitting. Opening details is an overlay
  // and must not change the grid scale.
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
    // Refit a mounted board before revealing a newly selected view.
    if (root.querySelector(".main-container__center") && !root.classList.contains("doubling-active")) {
      setLayoutReady(false);
    }
    let frame = 0;
    let readyFrame = 0;
    let initialFitStarted = false;
    let mountObserver;
    let disposed = false;

    const fit = () => {
      frame = 0;
      const area = root.querySelector(".game_area");
      const content = root.querySelector(".game-main-layout > .frame-content");
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
      const rootRect = root.getBoundingClientRect();
      const shortFrame = rootRect.width <= 1280 && rootRect.height <= 700;
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
      // Init can mount the center before it supplies a playable grid.
      if (!center.querySelector(".preloaded-grid-view--active .lottery-grid")) return;

      const areaRect = area.getBoundingClientRect();
      if (areaRect.width <= 0 || areaRect.height <= 0 || !footer) return;
      const footerTop = getFooterBoundaryTop(root, footer, areaRect.bottom);
      const compactLandscape = window.matchMedia("(orientation: landscape) and (max-width: 1280px)").matches;
      const logoWidth = compactLandscape
        ? Math.min(260, areaRect.width * 0.4)
        : areaRect.width <= 440
          ? areaRect.width * 0.8
          : Math.min(440, areaRect.width - GAP * 2);
      const logoHeight = logoWidth * LOGO_RATIO;
      const contentTop = compactLandscape
        ? Math.max(GAP, logoHeight - headerHeight + GAP)
        : logoHeight + GAP;
      root.dataset.fluidFit = "true";
      root.style.setProperty("--fluid-logo-width", `${logoWidth}px`);
      root.style.setProperty("--fluid-logo-height", `${logoHeight}px`);
      root.style.setProperty("--fluid-footer-reserve", `${Math.max(GAP, areaRect.bottom - footerTop + GAP)}px`);
      root.style.setProperty("--fluid-content-scale", "1");
      // Measure from an unscaled baseline. Keeping values divided by the
      // previous scale here creates a feedback loop whenever ticket content
      // changes and can make View 2 resize after a win.
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

      // Anchor the ticket to the visible active grid, not to a taller center
      // wrapper whose invisible tail varies by breakpoint.
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
      const contentStyle = content ? window.getComputedStyle(content) : null;
      const contentHorizontalPadding = contentStyle
        ? Number.parseFloat(contentStyle.paddingLeft || "0") +
          Number.parseFloat(contentStyle.paddingRight || "0")
        : 0;
      const widthScale = (areaRect.width - contentHorizontalPadding - GAP * 2) /
        Math.max(1, bounds.right - bounds.left);
      const boardElements = [
        root.querySelector(".main-container__left"),
        center,
        root.querySelector(".main-container__right"),
      ].filter(isVisible);
      const boardBottom = Math.max(...boardElements.map((element) => element.getBoundingClientRect().bottom));
      const boardHeight = Math.max(1, boardBottom - bounds.top);
      const mobileTicket = window.matchMedia("(max-width: 639px)").matches;
      const fixedTicketHeight = mobileTicket ? 52 : 56;
      const fixedTicketOffset = 5;
      const availableBoardHeight = footerTop - GAP - fixedTicketHeight - fixedTicketOffset -
        (areaRect.top + resolvedContentTop);
      const heightScale = availableBoardHeight / boardHeight;
      const scale = Math.max(0.1, Math.min(
        compactLandscape ? Number.POSITIVE_INFINITY : 1,
        widthScale,
        heightScale,
      ) * 0.995);
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
            setLayoutReady(true);
          });
        });
      }
    };
    const scheduleFit = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    // Refit only when stable viewport containers change. Gameplay DOM updates
    // (rotating win groups, ticket content, or footer actions) must never change
    // the scale of an already mounted board.
    const observer = new ResizeObserver(scheduleFit);
    const observed = new Set();
    const observeLayout = () => {
      const elements = [
        root,
        root.parentElement?.querySelector("header"),
        root.querySelector(".game_area"),
        root.querySelector(".header_img"),
      ];
      const current = new Set(elements.filter(Boolean));
      for (const element of observed) {
        if (!current.has(element)) {
          observer.unobserve(element);
          observed.delete(element);
        }
      }
      for (const element of current) {
        if (!observed.has(element)) {
          observer.observe(element);
          observed.add(element);
        }
      }
    };
    observeLayout();
    fit();
    const hasPlayableGrid = Boolean(
      root.querySelector(".main-container__center .preloaded-grid-view--active .lottery-grid"),
    );
    if (!hasPlayableGrid) {
      mountObserver = new MutationObserver(() => {
        // Observe only until the asynchronously loaded playable board exists.
        // Afterwards mutations are game state, not responsive layout changes.
        const playableGrid = root.querySelector(
          ".main-container__center .preloaded-grid-view--active .lottery-grid",
        );
        if (!playableGrid) return;
        observeLayout();
        scheduleFit();
        mountObserver?.disconnect();
        mountObserver = undefined;
      });
      mountObserver.observe(root, { childList: true, subtree: true });
    }
    const fontsReady = () => { if (!disposed) scheduleFit(); };
    document.fonts?.ready.then(fontsReady);
    document.fonts?.addEventListener("loadingdone", fontsReady);
    window.addEventListener("resize", fit, { passive: true });
    document.addEventListener("fullscreenchange", fit);

    return () => {
      disposed = true;
      document.fonts?.removeEventListener("loadingdone", fontsReady);
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

