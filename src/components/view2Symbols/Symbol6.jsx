import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol6Assets = {
  staticImage: "/assets/img/view2-symbol-6-static.webp?v=20260711-1",
  isDice: true,
};

export default function Symbol6(props) {
  return <View2SymbolBase symbol={6} {...symbol6Assets} {...props} />;
}
