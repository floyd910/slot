import { View2SymbolBase, view2SymbolAsset, view2SymbolFrames } from "./View2SymbolBase.jsx";

export const symbol12Assets = {
  staticImage: view2SymbolAsset(12, "1.png"),
  background: view2SymbolAsset(12, "background.png"),
  winFrames: view2SymbolFrames(12, 8),
  forwardLoop: true,
  frameMs: 250,
};

export default function Symbol12(props) {
  return <View2SymbolBase symbol={12} {...symbol12Assets} {...props} />;
}
