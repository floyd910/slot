import { useLayoutEffect } from "react";

const LOGO_RATIO = 61 / 258;
const MIN_LOGO_WIDTH = 240;
const GAP = 10;
const FIT_PROPERTIES = [
  "--fluid-logo-width",
  "--fluid-logo-height",
  "--fluid-footer-reserve",
  "--fluid-content-scale",
  "--header-content-start",
];

const isVisible = (element) =>
  element && element.getClientRects().length > 0 && getComputedStyle(element).display !== "none";

const clearFluidFit = (root) => {
  root.removeAttribute("data-fluid-fit");
  root.removeAttribute("data-fluid-logo-fit");
  FIT_PROPERTIES.forEach((name) => root.style.removeProperty(name));
};


const getVisibleFooter = (root) =>
  Array.from(root.querySelectorAll(".footer-block")).find(isVisible);

const getMeasuredContent = (root, center) => {
  const activeGrid = center.querySelector(".preloaded-grid-view--active .lottery-grid");
  const elements = [
    root.querySelector(".main-container__left"),
    center,
    activeGrid,
    center.querySelector(".grid-bottom-panel"),
    root.querySelector(".main-container__right"),
  ].filter(isVisible);
  const rects = elements.map((element) => element.getBoundingClientRect());


  return {
    activeGrid,
    elements,
    rects,
    top: Math.min(...rects.map((rect) => rect.top)),
    right: Math.max(...rects.map((rect) => rect.right)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
    left: Math.min(...rects.map((rect) => rect.left)),
  };
};

export function useResponsiveGameLayout(rootRef, layoutMode) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let animationFrame = 0;
    let verifyFrame = 0;
    let measuring = false;
    let constrainedLogoWidth = null;
    let constrainedViewportKey = "";
    let doublingActive = root.classList.contains("doubling-active");

    const verifyFit = (attempt = 0) => {
      const gameArea = root.querySelector(".game_area");
      const logo = root.querySelector(".header_img");
      const center = root.querySelector(".main-container__center");
      const footer = getVisibleFooter(root);
      if (!gameArea || !logo || !center || !footer || !root.dataset.fluidFit) return;

      const areaRect = gameArea.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const content = getMeasuredContent(root, center);
      const availableTop = logoRect.bottom + GAP;
      const availableBottom = footerRect.top - GAP;
      const availableHeight = Math.max(1, availableBottom - availableTop);
      const contentHeight = Math.max(1, content.bottom - content.top);
      const availableWidth = Math.max(1, areaRect.width - GAP * 2);
      const contentWidth = Math.max(1, content.right - content.left);
      const correction = Math.min(
        1,
        availableHeight / contentHeight,
        availableWidth / contentWidth,
      );
      const stillOverlaps =
        content.top < availableTop - 0.5 ||
        content.bottom > availableBottom + 0.5 ||
        content.left < areaRect.left + GAP - 0.5 ||
        content.right > areaRect.right - GAP + 0.5;

      if (stillOverlaps && correction < 0.999 && attempt < 4) {
        const currentScale = Number(root.style.getPropertyValue("--fluid-content-scale")) || 1;
        root.style.setProperty("--fluid-content-scale", String(currentScale * correction * 0.995));
        verifyFrame = requestAnimationFrame(() => verifyFit(attempt + 1));
      }
    };

    const fit = () => {
      if (measuring) return;
      measuring = true;
      cancelAnimationFrame(verifyFrame);
      clearFluidFit(root);

      const gameArea = root.querySelector(".game_area");
      const logo = root.querySelector(".header_img");
      const center = root.querySelector(".main-container__center");
      if (!gameArea || !logo || !center || root.classList.contains("doubling-active")) {
        constrainedLogoWidth = null;
        constrainedViewportKey = "";
        measuring = false;
        return;
      }

      const footer = getVisibleFooter(root);
      const areaRect = gameArea.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();
      const footerTop = footerRect?.top ?? areaRect.bottom;
      root.style.setProperty(
        "--header-content-start",
        Math.max(0, logoRect.bottom - areaRect.top + GAP) + "px",
      );
      const usesUnifiedResponsiveFit =
        areaRect.width >= 320 &&
        (areaRect.width <= 1024 || areaRect.height <= 760);

      if (usesUnifiedResponsiveFit) {
        const logoWidth = Math.min(
          440,
          areaRect.width * 0.9,
          (areaRect.height * 0.18) / LOGO_RATIO,
        );
        const logoHeight = logoWidth * LOGO_RATIO;
        const footerReserve = footerRect
          ? Math.max(0, areaRect.bottom - footerRect.top) + GAP
          : GAP;

        root.style.setProperty("--fluid-logo-width", `${logoWidth}px`);
        root.style.setProperty("--fluid-logo-height", `${logoHeight}px`);
        root.style.setProperty("--fluid-footer-reserve", `${footerReserve}px`);
        root.style.setProperty("--fluid-content-scale", "1");
        root.dataset.fluidFit = "true";

        const activeGrid = center.querySelector(
          ".preloaded-grid-view--active .lottery-grid",
        );
        const availableWidth = Math.max(1, areaRect.width - GAP * 2);
        const availableTop = areaRect.top + logoHeight + GAP;
        const availableHeight = Math.max(1, footerTop - GAP - availableTop);
        const content = getMeasuredContent(root, center);
        const nativeContentWidth = Math.max(1, content.right - content.left);
        const nativeContentHeight = Math.max(1, content.bottom - content.top);
        const scale = Math.max(
          0.01,
          Math.min(
            1,
            availableWidth / nativeContentWidth,
            availableHeight / nativeContentHeight,
          ) * 0.995,
        );

        root.style.setProperty("--fluid-content-scale", String(scale));
        constrainedLogoWidth = logoWidth;
        constrainedViewportKey = `${Math.round(areaRect.width)}x${Math.round(areaRect.height)}`;
        measuring = false;
        return;
      }

      const content = getMeasuredContent(root, center);
      const viewportKey = `${Math.round(areaRect.width)}x${Math.round(areaRect.height)}`;
      if (viewportKey !== constrainedViewportKey) {
        constrainedViewportKey = viewportKey;
        constrainedLogoWidth = logoRect.width;
      }
      const overlaps =
        logoRect.bottom + GAP > content.top ||
        content.bottom + GAP > footerTop ||
        content.left < areaRect.left + GAP ||
        content.right > areaRect.right - GAP;

      // Preserve the authored breakpoint layout unless it violates a hard boundary.
      if (!overlaps) {
        if (constrainedLogoWidth != null) {
          root.style.setProperty("--fluid-logo-width", `${constrainedLogoWidth}px`);
          root.style.setProperty("--fluid-logo-height", `${constrainedLogoWidth * LOGO_RATIO}px`);
          root.dataset.fluidLogoFit = "true";
        }
        measuring = false;
        return;
      }

      const footerReserve = footerRect
        ? Math.max(0, areaRect.bottom - footerRect.top) + GAP
        : GAP;
      const minimumLogoWidth = areaRect.width >= 721
        ? Math.min(440, logoRect.width, areaRect.width - 24)
        : Math.min(MIN_LOGO_WIDTH, logoRect.width, areaRect.width * 0.7);
      const nativeContentHeight = Math.max(1, content.bottom - content.top);
      const nativeContentWidth = Math.max(1, content.right - content.left);
      const widthRatio = Math.min(1, (areaRect.width - GAP * 2) / nativeContentWidth);
      const minimumContentHeight = nativeContentHeight * widthRatio;
      const maximumLogoHeight = Math.max(
        minimumLogoWidth * LOGO_RATIO,
        footerTop - areaRect.top + 24 - minimumContentHeight - GAP * 2,
      );
      const logoWidth = Math.max(
        minimumLogoWidth,
        Math.min(logoRect.width, maximumLogoHeight / LOGO_RATIO),
      );
      constrainedLogoWidth = Math.min(constrainedLogoWidth ?? logoWidth, logoWidth);
      const logoHeight = logoWidth * LOGO_RATIO;
      const fluidContentTop = areaRect.top + logoHeight - 20;
      const availableContentHeight = Math.max(1, footerTop - GAP - fluidContentTop);
      const heightRatio = Math.min(1, availableContentHeight / nativeContentHeight);
      const scale = Math.max(0.01, Math.min(widthRatio, heightRatio));

      root.style.setProperty("--fluid-logo-width", `${constrainedLogoWidth}px`);
      root.style.setProperty("--fluid-logo-height", `${constrainedLogoWidth * LOGO_RATIO}px`);
      root.style.setProperty("--fluid-footer-reserve", `${footerReserve}px`);
      root.style.setProperty("--fluid-content-scale", String(scale));
      root.dataset.fluidFit = "true";
      measuring = false;
      verifyFrame = requestAnimationFrame(() => verifyFit());
    };

    const scheduleFit = () => {
      if (measuring) return;
      const nextDoublingActive = root.classList.contains("doubling-active");
      const exitedDoubling = doublingActive && !nextDoublingActive;
      doublingActive = nextDoublingActive;

      cancelAnimationFrame(animationFrame);
      if (exitedDoubling) {
        constrainedLogoWidth = null;
        constrainedViewportKey = "";
        clearFluidFit(root);
        animationFrame = requestAnimationFrame(() => {
          animationFrame = requestAnimationFrame(fit);
        });
        return;
      }
      animationFrame = requestAnimationFrame(fit);
    };
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(root);
    const mutationObserver = new MutationObserver((mutations) => {
      const requiresFit = mutations.some((mutation) => {
        if (mutation.type === "childList") {
          return Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.classList?.contains("grid-bottom-panel") ||
                node.querySelector?.(".grid-bottom-panel")),
          );
        }
        return mutation.attributeName === "class" &&
          ((mutation.target === root &&
            root.classList.contains("doubling-active") !== doublingActive) ||
            mutation.target.classList?.contains("grid-bottom-panel"));
      });
      if (requiresFit) scheduleFit();
    });
    mutationObserver.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("resize", scheduleFit);
    document.fonts?.ready.then(scheduleFit);
    scheduleFit();

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(verifyFrame);
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", scheduleFit);
      clearFluidFit(root);
    };
  }, [rootRef, layoutMode]);
}