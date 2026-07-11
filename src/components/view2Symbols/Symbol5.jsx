import { View2SymbolBase, view2SymbolAsset } from "./View2SymbolBase.jsx";

export const symbol5Assets = {
  staticImage: "/assets/img/view2-symbol-5-static.png?v=20260711-1",
  shine: view2SymbolAsset(5, "shine.png"),
  isDice: true,
};

export default function Symbol5(props) {
  return <View2SymbolBase symbol={5} {...symbol5Assets} {...props} />;
}
