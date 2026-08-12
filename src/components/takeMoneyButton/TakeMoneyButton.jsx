export default function TakeMoneyButton({ disabled, label, onClick }) {
  return (
    <div
      className={`action_button take-money${disabled ? " --disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      onPointerDown={(event) => {
        if (!disabled) event.currentTarget.classList.add("--pressed");
      }}
      onPointerUp={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
      onPointerLeave={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
      onPointerCancel={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
      onKeyDown={(event) => {
        if (disabled || !isActivationKey(event.key)) return;
        event.preventDefault();
        event.currentTarget.classList.add("--pressed");
        if (onClick) onClick();
      }}
      onKeyUp={(event) => {
        if (!isActivationKey(event.key)) return;
        event.currentTarget.classList.remove("--pressed");
      }}
      onBlur={(event) => {
        event.currentTarget.classList.remove("--pressed");
      }}
    >
      <span className="action_btn_title take-money__title">{label}</span>
    </div>
  );
}

function isActivationKey(key) {
  return key === "Enter" || key === " ";
}