import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol3Assets = {
  staticImage: "/assets/img/view2-symbol-3-static.png?v=20260711-1",
  shine: view2SymbolAsset(3, "shine.png"),
  isDice: true,
};

export default function Symbol3(props) {
  return <View2SymbolBase symbol={3} {...symbol3Assets} {...props} />;
}
