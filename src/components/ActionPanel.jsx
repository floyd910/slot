import { Eye, Maximize, Menu, Minimize, Volume2, VolumeX } from "lucide-react";

const actions = [
  { id: "visual", label: "Visualization", icon: Eye },
  { id: "fullscreen", label: "Fullscreen", icon: Maximize },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "menu", label: "Menu", icon: Menu },
];

export default function ActionPanel({ onAction, disabled, soundEnabled = true, expanded = false }) {
  const items = actions;

  return (
    <aside className="action-panel">
      {items.map((item) => {
        const Icon = item.id === "sound" && !soundEnabled ? VolumeX : item.id === "fullscreen" && expanded ? Minimize : item.icon;
        const className = `action-button${item.id === "sound" && !soundEnabled ? " muted" : ""}${item.id === "fullscreen" && expanded ? " active" : ""}`;
        return (
          <button key={item.id} className={className} data-action={item.id} type="button" disabled={disabled} onClick={() => onAction(item.id)} title={item.id === "fullscreen" && expanded ? "Exit fullscreen view" : item.label}>
            <Icon size={22} />
          </button>
        );
      })}
    </aside>
  );
}
