import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol8Assets = {
  staticImage: "/assets/img/view2-symbol-8-static.png?v=20260711-1",
  forwardLoop: true,
  frameMs: 40,
  winFrames: Array.from({ length: 144 }, (_, index) =>
    `/assets/img/eight/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  ),
};

export default function Symbol8(props) {
  return <View2SymbolBase symbol={8} {...symbol8Assets} {...props} />;
}
