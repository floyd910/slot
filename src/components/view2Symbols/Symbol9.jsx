import {
  View2SymbolBase,
  view2SymbolAsset,
  view2SymbolFrames,
} from "./View2SymbolBase.jsx";

export const symbol9Assets = {
  staticImage: view2SymbolAsset(9, "1.png"),
  background: view2SymbolAsset(9, "background.png"),
  winFrames: view2SymbolFrames(9, 8),
  forwardLoop: true,
  frameMs: 250,
};
export default function Symbol9(props) {
  return <View2SymbolBase symbol={9} {...symbol9Assets} {...props} />;
}
