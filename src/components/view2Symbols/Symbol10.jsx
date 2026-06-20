import { View2SymbolBase, view2SymbolAsset, view2SymbolFrames } from "./View2SymbolBase.jsx";

export const symbol10Assets = {
  staticImage: view2SymbolAsset(10, "1.png"),
  background: view2SymbolAsset(10, "background.png"),
  winFrames: view2SymbolFrames(10, 15),
};

export default function Symbol10(props) {
  return <View2SymbolBase symbol={10} {...symbol10Assets} {...props} />;
}
