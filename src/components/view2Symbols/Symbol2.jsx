import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol2Assets = {
  staticImage: "/assets/img/view2-symbol-2-static.webp?v=20260711-2",
  isDice: true,
};

export default function Symbol2(props) {
  return <View2SymbolBase symbol={2} {...symbol2Assets} {...props} />;
}
