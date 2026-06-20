import { View2SymbolBase, view2SymbolAsset, view2SymbolFrames } from "./View2SymbolBase.jsx";

export const symbol0Assets = {
  staticImage: view2SymbolAsset(0, "1.png"),
  background: view2SymbolAsset(0, "background.png"),
  winFrames: view2SymbolFrames(0, 10),
};

export default function Symbol0(props) {
  return <View2SymbolBase symbol={0} {...symbol0Assets} {...props} />;
}
