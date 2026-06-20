import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol6Assets = {
  staticImage: view2SymbolAsset(6, "1.png"),
  background: view2SymbolAsset(6, "background-purple.png"),
  shine: view2SymbolAsset(6, "shine.png"),
  isDice: true,
};

export default function Symbol6(props) {
  return <View2SymbolBase symbol={6} {...symbol6Assets} {...props} />;
}
