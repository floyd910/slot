import { CircleDollarSign, Info, List, Menu, Play, Shuffle, Sparkles, Table2 } from "lucide-react";

const actions = [
  { id: "cashout", label: "Take Money", icon: CircleDollarSign },
  { id: "info", label: "Info", icon: Info },
  { id: "points", label: "Points", icon: List },
  { id: "menu", label: "Menu", icon: Menu },
  { id: "visual", label: "Visualization", icon: Sparkles },
  { id: "stake", label: "Stake", icon: Table2 },
  { id: "combo", label: "Lottery Combination", icon: Shuffle },
  { id: "auto", label: "Auto Express", icon: Play },
];

export default function ActionPanel({ onAction, disabled, inDoubleMode }) {
  const items = inDoubleMode
    ? [
        actions[0],
        actions[1],
        actions[2],
        actions[3],
        actions[4],
        { id: "double-left", label: "Left", icon: Shuffle },
        { id: "double-right", label: "Right", icon: Shuffle },
        actions[7],
      ]
    : actions;

  return (
    <aside className="action-panel">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className="action-button" type="button" disabled={disabled} onClick={() => onAction(item.id)}>
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
