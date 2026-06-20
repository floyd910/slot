import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol3Assets = {
  staticImage: view2SymbolAsset(3, "1.png"),
  background: view2SymbolAsset(3, "background.png"),
  shine: view2SymbolAsset(3, "shine.png"),
  isDice: true,
};

export default function Symbol3(props) {
  return <View2SymbolBase symbol={3} {...symbol3Assets} {...props} />;
}
