import { View2SymbolBase, view2SymbolAsset, view2SymbolFrames } from "./View2SymbolBase.jsx";

export const symbol11Assets = {
  staticImage: view2SymbolAsset(11, "1.png"),
  background: view2SymbolAsset(11, "background.png"),
  winFrames: view2SymbolFrames(11, 7),
  frameMs: 250,
};

export default function Symbol11(props) {
  return <View2SymbolBase symbol={11} {...symbol11Assets} {...props} />;
}
