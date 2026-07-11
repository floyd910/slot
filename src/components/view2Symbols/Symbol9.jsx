import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol9Assets = {
  staticImage: "/assets/img/view2-symbol-9-static.png?v=20260711-2",
  animatedImage: "/assets/img/animations/view2-symbol-9-win.webp",
  cycleMs: 5760,
};

export default function Symbol9(props) {
  return <View2SymbolBase symbol={9} {...symbol9Assets} {...props} />;
}
