import "./GameMenu.css";

export default function GameMenu({ onClose }) {
  return (
    <div
      className="game-menu-layer"
      role="presentation"
      onClick={onClose}
    >
      <nav
        className="game-menu-panel"
        aria-label={"\u0418\u0433\u0440\u043e\u0432\u043e\u0435 \u043c\u0435\u043d\u044e"}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="game-menu-panel__close"
          type="button"
          aria-label={"\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e"}
          onClick={onClose}
        >
          <img src="/img/ui/game-menu-close.png" alt="" />
        </button>
        <button type="button">{'\u0418\u0421\u0422\u041e\u0420\u0418\u042f \u0422\u0418\u0420\u0410\u0416\u0415\u0419'}</button>
        <button type="button">{'\u041f\u0420\u0410\u0412\u0418\u041b\u0410'}</button>
      </nav>
    </div>
  );
}
