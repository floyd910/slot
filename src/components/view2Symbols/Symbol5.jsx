import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol5Assets = {
  staticImage: view2SymbolAsset(5, "1.png"),
  background: view2SymbolAsset(5, "background.png"),
  shine: view2SymbolAsset(5, "shine.png"),
  isDice: true,
};

export default function Symbol5(props) {
  return <View2SymbolBase symbol={5} {...symbol5Assets} {...props} />;
}
