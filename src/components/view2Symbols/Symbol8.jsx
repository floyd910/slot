import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol8Assets = {
  staticImage: "/assets/img/view2-symbol-8-static.webp?v=20260711-1",
  animatedImage: "/assets/img/animations/view2-symbol-8-win.webp",
  cycleMs: 5760,
};

export default function Symbol8(props) {
  return <View2SymbolBase symbol={8} {...symbol8Assets} {...props} />;
}
