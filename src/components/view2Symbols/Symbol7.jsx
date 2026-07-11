import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol7Assets = {
  staticImage: "/assets/img/view2-symbol-7-static.png?v=20260711-2",
  animatedImage: "/assets/img/animations/view2-symbol-7-win.webp",
  cycleMs: 5760,
};

export default function Symbol7(props) {
  return <View2SymbolBase symbol={7} {...symbol7Assets} {...props} />;
}
