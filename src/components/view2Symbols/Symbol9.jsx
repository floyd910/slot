import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol9Assets = {
  staticImage: "/assets/img/view2-symbol-9-static.png?v=20260711-2",
  winFrames: Array.from({ length: 144 }, (_, index) =>
    `/assets/img/nine/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  ),
  forwardLoop: true,
  frameMs: 40,
};
export default function Symbol9(props) {
  return <View2SymbolBase symbol={9} {...symbol9Assets} {...props} />;
}
