import {
  View2SymbolBase,
  view2SymbolAsset,
  view2SymbolFrames,
} from "./View2SymbolBase.jsx";

export const symbol12Assets = {
  staticImage: view2SymbolAsset(12, "4.png"),
  background: view2SymbolAsset(12, "background.png"),
  winFrames: view2SymbolFrames(12, 12),
  forwardLoop: true,
  frameMs: 167,
};

export default function Symbol12(props) {
  return <View2SymbolBase symbol={12} {...symbol12Assets} {...props} />;
}
