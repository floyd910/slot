import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol7Assets = {
  staticImage: "/assets/img/view2-symbol-7-static.png?v=20260711-2",
  forwardLoop: true,
  frameMs: 40,
  winFrames: Array.from({ length: 144 }, (_, index) =>
    `/assets/img/seven/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  ),
};

export default function Symbol7(props) {
  return <View2SymbolBase symbol={7} {...symbol7Assets} {...props} />;
}
