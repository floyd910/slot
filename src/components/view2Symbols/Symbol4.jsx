import { View2SymbolBase } from "./View2SymbolBase.jsx";

export const symbol4Assets = {
  staticImage: "/assets/img/view2-symbol-4-static.webp?v=20260711-1",
  isDice: true,
};

export default function Symbol4(props) {
  return <View2SymbolBase symbol={4} {...symbol4Assets} {...props} />;
}
