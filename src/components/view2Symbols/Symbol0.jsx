import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol0Assets = {
  staticImage: "/assets/img/view2-symbol-0-static.png?v=20260711-2",
  winFrames: Array.from({ length: 144 }, (_, index) =>
    `/assets/img/zero/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  ),
  forwardLoop: true,
  frameMs: 40,
};

export default function Symbol0(props) {
  return <View2SymbolBase symbol={0} {...symbol0Assets} {...props} />;
}
