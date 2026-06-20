import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol1Assets = {
  staticImage: view2SymbolAsset(1, "1.png"),
  background: view2SymbolAsset(1, "background.png"),
  shine: view2SymbolAsset(1, "shine.png"),
  isDice: true,
};

export default function Symbol1(props) {
  return <View2SymbolBase symbol={1} {...symbol1Assets} {...props} />;
}
