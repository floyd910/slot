import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol11Assets = {
  staticImage: "/assets/img/view2-symbol-11-static.webp?v=20260711-1",
  animatedImage: "/assets/img/animations/view2-symbol-11-win.webp",
  cycleMs: 5760,
};

export default function Symbol11(props) {
  return <View2SymbolBase symbol={11} {...symbol11Assets} {...props} />;
}
