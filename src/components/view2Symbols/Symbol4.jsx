import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol4Assets = {
  staticImage: "/assets/img/view2-symbol-4-static.png?v=20260711-1",
  shine: view2SymbolAsset(4, "shine.png"),
  isDice: true,
};

export default function Symbol4(props) {
  return <View2SymbolBase symbol={4} {...symbol4Assets} {...props} />;
}
