import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol6Assets = {
  staticImage: "/assets/img/view2-symbol-6-static.png?v=20260711-1",
  shine: view2SymbolAsset(6, "shine.png"),
  isDice: true,
};

export default function Symbol6(props) {
  return <View2SymbolBase symbol={6} {...symbol6Assets} {...props} />;
}
