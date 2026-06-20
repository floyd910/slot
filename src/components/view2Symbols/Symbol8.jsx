import { View2SymbolBase, view2SymbolAsset, view2SymbolFrames } from "./View2SymbolBase.jsx";

export const symbol8Assets = {
  staticImage: view2SymbolAsset(8, "1.png"),
  background: view2SymbolAsset(8, "background.png"),
  winFrames: view2SymbolFrames(8, 2),
};

export default function Symbol8(props) {
  return <View2SymbolBase symbol={8} {...symbol8Assets} {...props} />;
}
