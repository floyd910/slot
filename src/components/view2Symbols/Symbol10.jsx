import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol10Assets = {
  staticImage: "/assets/img/view2-symbol-10-static.webp?v=20260711-1",
  animatedImage: "/assets/img/animations/view2-symbol-10-win.webp",
  cycleMs: 5760,
};

export default function Symbol10(props) {
  return <View2SymbolBase symbol={10} {...symbol10Assets} {...props} />;
}
