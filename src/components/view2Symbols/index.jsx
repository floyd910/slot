import Symbol0, { symbol0Assets } from "./Symbol0.jsx";
import Symbol1, { symbol1Assets } from "./Symbol1.jsx";
import Symbol2, { symbol2Assets } from "./Symbol2.jsx";
import Symbol3, { symbol3Assets } from "./Symbol3.jsx";
import Symbol4, { symbol4Assets } from "./Symbol4.jsx";
import Symbol5, { symbol5Assets } from "./Symbol5.jsx";
import Symbol6, { symbol6Assets } from "./Symbol6.jsx";
import Symbol7, { symbol7Assets } from "./Symbol7.jsx";
import Symbol8, { symbol8Assets } from "./Symbol8.jsx";
import Symbol9, { symbol9Assets } from "./Symbol9.jsx";
import Symbol10, { symbol10Assets } from "./Symbol10.jsx";
import Symbol11, { symbol11Assets } from "./Symbol11.jsx";
import Symbol12, { symbol12Assets } from "./Symbol12.jsx";
import {
  VIEW2_SYMBOL_WIN_CYCLE_MS,
  view2SymbolAssetSources,
} from "./View2SymbolBase.jsx";

export const VIEW2_SYMBOL_COMPONENTS = {
  0: Symbol0,
  1: Symbol1,
  2: Symbol2,
  3: Symbol3,
  4: Symbol4,
  5: Symbol5,
  6: Symbol6,
  7: Symbol7,
  8: Symbol8,
  9: Symbol9,
  10: Symbol10,
  11: Symbol11,
  12: Symbol12,
};

export const VIEW2_SYMBOL_CONFIGS = {
  0: symbol0Assets,
  1: symbol1Assets,
  2: symbol2Assets,
  3: symbol3Assets,
  4: symbol4Assets,
  5: symbol5Assets,
  6: symbol6Assets,
  7: symbol7Assets,
  8: symbol8Assets,
  9: symbol9Assets,
  10: symbol10Assets,
  11: symbol11Assets,
  12: symbol12Assets,
};

export const VIEW2_SYMBOL_ASSET_SOURCES = Object.values(VIEW2_SYMBOL_CONFIGS)
  .flatMap(view2SymbolAssetSources);

const getSymbolCycleMs = (assets) => {
  if (assets.cycleMs) return assets.cycleMs;
  if (!assets.winFrames?.length || assets.winFrames.length <= 1) return 0;
  if (!assets.frameMs) return VIEW2_SYMBOL_WIN_CYCLE_MS;
  const frameCount = assets.forwardLoop
    ? assets.winFrames.length
    : assets.winFrames.length * 2 - 2;
  return Math.max(frameCount, 1) * assets.frameMs;
};

const getSymbolHighlightMs = (assets) => {
  if (assets.singlePlayMs) return assets.singlePlayMs;
  if (assets.animatedImage && assets.cycleMs) return assets.cycleMs;
  return getSymbolCycleMs(assets);
};

export const VIEW2_SYMBOL_GROUP_CYCLE_MS =
  Math.max(...Object.values(VIEW2_SYMBOL_CONFIGS).map(getSymbolHighlightMs)) ||
  VIEW2_SYMBOL_WIN_CYCLE_MS;
