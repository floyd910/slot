import fs from 'node:fs';
import path from 'node:path';

const project = path.resolve(process.argv[2] || '.');
const hook = path.join(project, 'src/hooks/useResponsiveGameLayout.js');
let source = fs.readFileSync(hook, 'utf8');
source = source.replace('      const areaRect = area.getBoundingClientRect();', `      const desktopView1 = root.classList.contains("view-1") &&
        window.matchMedia("(min-width: 1025px)").matches;
      root.dataset.desktopView1Fit = String(desktopView1);
      for (const name of ["left", "center", "right"]) {
        root.style.setProperty(\`--desktop-view1-\${name}-zoom\`, "1");
      }
      const areaRect = area.getBoundingClientRect();`);
source = source.replace('      const scale = mobileView2ExactWidth', `      // Each desktop panel uses the full available height. Zoom participates
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
        const desiredWidth = panels.reduce((sum, { rect }) =>
          sum + rect.width * availableHeight / Math.max(1, rect.height), 0);
        const widthFit = Math.min(1, Math.max(1, areaRect.width - 40 - gap * (panels.length - 1)) /
          Math.max(1, desiredWidth));
        for (const { element, rect } of panels) {
          const name = ["left", "center", "right"].find((part) =>
            element.classList.contains(\`main-container__\${part}\`));
          root.style.setProperty(\`--desktop-view1-\${name}-zoom\`,
            String(availableHeight / Math.max(1, rect.height) * widthFit));
        }
        root.style.setProperty("--fluid-footer-reserve",
          \`\${Math.max(20, areaRect.bottom - footerTop + 20)}px\`);
        desktopScale = 1;
      }
      const scale = desktopScale ?? (mobileView2ExactWidth`);
source = source.replace('          ) * 0.995);', '          ) * 0.995));');
fs.writeFileSync(hook, source);
const css = path.join(project, 'src/components/gameShell/GameShell.css');
fs.appendFileSync(css, `
/* Desktop View 1: fit all three panels to the measured footer boundary. */
@media (min-width: 1025px) {
  .frame-app[data-desktop-view1-fit="true"].view-1:not(.doubling-active) .game-main-layout > .frame-content {
    transform: none;
    align-items: flex-end;
  }
  .frame-app[data-desktop-view1-fit="true"].view-1:not(.doubling-active) .main-container__left,
  .frame-app[data-desktop-view1-fit="true"].view-1:not(.doubling-active) .main-container__center,
  .frame-app[data-desktop-view1-fit="true"].view-1:not(.doubling-active) .main-container__right {
    display: flex;
    flex-shrink: 0;
    transform: none !important;
    left: auto !important;
    right: auto !important;
    margin-top: 0;
    margin-bottom: 0;
  }
  .frame-app[data-desktop-view1-fit="true"] .main-container__left { zoom: var(--desktop-view1-left-zoom, 1); }
  .frame-app[data-desktop-view1-fit="true"] .main-container__center { zoom: var(--desktop-view1-center-zoom, 1); }
  .frame-app[data-desktop-view1-fit="true"] .main-container__right { zoom: var(--desktop-view1-right-zoom, 1); }
}
`);
