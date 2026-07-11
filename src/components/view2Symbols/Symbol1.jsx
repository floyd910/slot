import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol1Assets = {
  staticImage: "/assets/img/view2-symbol-1-static.png?v=20260711-1",
  isDice: true,
};

export default function Symbol1(props) {
  return <View2SymbolBase symbol={1} {...symbol1Assets} {...props} />;
}
