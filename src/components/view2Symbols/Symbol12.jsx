import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol12Assets = {
  staticImage: "/assets/img/view2-symbol-12-static.png?v=20260711-1",
  animatedImage: "/assets/img/animations/view2-symbol-12-win.webp",
  cycleMs: 5760,
};

export default function Symbol12(props) {
  return <View2SymbolBase symbol={12} {...symbol12Assets} {...props} />;
}
