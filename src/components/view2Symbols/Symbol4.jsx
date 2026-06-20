import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol4Assets = {
  staticImage: view2SymbolAsset(4, "1.png"),
  background: view2SymbolAsset(4, "background.png"),
  shine: view2SymbolAsset(4, "shine.png"),
  isDice: true,
};

export default function Symbol4(props) {
  return <View2SymbolBase symbol={4} {...symbol4Assets} {...props} />;
}
