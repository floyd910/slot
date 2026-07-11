import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol10Assets = {
  staticImage: "/assets/img/view2-symbol-10-static.png?v=20260711-1",
  forwardLoop: true,
  frameMs: 40,
  winFrames: Array.from({ length: 144 }, (_, index) =>
    `/assets/img/ten/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  ),
};

export default function Symbol10(props) {
  return <View2SymbolBase symbol={10} {...symbol10Assets} {...props} />;
}
