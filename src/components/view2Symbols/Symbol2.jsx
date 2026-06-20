import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol2Assets = {
  staticImage: view2SymbolAsset(2, "1.png"),
  background: view2SymbolAsset(2, "background.png"),
  shine: view2SymbolAsset(2, "shine.png"),
  isDice: true,
};

export default function Symbol2(props) {
  return <View2SymbolBase symbol={2} {...symbol2Assets} {...props} />;
}
