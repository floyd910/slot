import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol2Assets = {
  staticImage: "/assets/img/view2-symbol-2-static.png?v=20260711-2",
  shine: view2SymbolAsset(2, "shine.png"),
  isDice: true,
};

export default function Symbol2(props) {
  return <View2SymbolBase symbol={2} {...symbol2Assets} {...props} />;
}
