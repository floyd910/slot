import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol0Assets = {
  staticImage: "/assets/img/view2-symbol-0-static.webp?v=20260711-2",
  animatedImage: "/assets/img/animations/view2-symbol-0-win.webp",
  cycleMs: 5760,
};

export default function Symbol0(props) {
  return <View2SymbolBase symbol={0} {...symbol0Assets} {...props} />;
}
