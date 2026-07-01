import "./BottomBar.css";
import { useLanguage } from "../i18n.jsx";
import BasicControlButton from "./controls/BasicControlButton.jsx";
import TakeMoneyButton from "./controls/TakeMoneyButton.jsx";
import {
  buildBottomBarControls,
  getBottomBarLabel,
} from "../viewModels/bottomBarControls.js";

export default function BottomBar(props) {
  const { language, t, toggleLanguage } = useLanguage();
  const controls = buildBottomBarControls({
    ...props,
    toggleLanguage,
  });

  return (
    <footer className="bottom-bar">
      <div className="control-panel">
        {controls.map((control) => {
          const label = getBottomBarLabel(control.type, { language, t });

          if (control.kind === "takeMoney") {
            return (
              <TakeMoneyButton
                key={control.type}
                disabled={control.disabled}
                label={label}
                onClick={control.onClick}
              />
            );
          }

          return (
            <BasicControlButton
              key={control.type}
              active={control.active}
              disabled={control.disabled}
              extraClass={control.extraClass}
              label={label}
              onClick={control.onClick}
              suppressPressFeedback={control.suppressPressFeedback}
              type={control.type}
            />
          );
        })}
      </div>
    </footer>
  );
}