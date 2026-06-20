import { View2SymbolBase, view2SymbolAsset, view2SymbolFrames } from "./View2SymbolBase.jsx";

export const symbol7Assets = {
  staticImage: view2SymbolAsset(7, "1.png"),
  background: view2SymbolAsset(7, "background.png"),
  winFrames: view2SymbolFrames(7, 6),
};

export default function Symbol7(props) {
  return <View2SymbolBase symbol={7} {...symbol7Assets} {...props} />;
}
