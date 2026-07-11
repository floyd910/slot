import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol12Assets = {
  staticImage: "/assets/img/view2-symbol-12-static.png?v=20260711-1",
  winFrames: Array.from({ length: 144 }, (_, index) =>
    `/assets/img/twelve/frame_${String(index).padStart(3, "0")}_delay-0.04s.png`,
  ),
  forwardLoop: true,
  frameMs: 40,
};

export default function Symbol12(props) {
  return <View2SymbolBase symbol={12} {...symbol12Assets} {...props} />;
}
