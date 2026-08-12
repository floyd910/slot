export default function BasicControlButton({
  active = false,
  disabled = false,
  extraClass = "",
  label,
  onClick,
  suppressPressFeedback = false,
  type,
}) {
  return (
    <div
      className={`basic-button ${extraClass}${active ? " --active" : ""}${disabled ? " --disabled" : ""}${suppressPressFeedback ? " --no-press-feedback" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      onKeyDown={(event) => {
        if (disabled || !isActivationKey(event.key)) return;
        event.preventDefault();
        if (!suppressPressFeedback) event.currentTarget.classList.add("--pressed");
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
      <span className={`basic-button__label --${type}`}>
        <ButtonLabel label={label} />
      </span>
    </div>
  );
}

function ButtonLabel({ label }) {
  if (!label || typeof label !== "object") return label;

  return (
    <>
      {label.firstLine}
      {label.secondLine && <br />}
      {label.secondLine}
    </>
  );
}

function isActivationKey(key) {
  return key === "Enter" || key === " ";
}