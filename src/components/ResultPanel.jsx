import "./ResultPanel.css";

export default function ResultPanel({ result, freeSpinsTotal, freeSpinsLeft }) {
  const message = result
    ? getResultMessage(result, freeSpinsTotal, freeSpinsLeft)
    : "Р’С‹Р±РµСЂРёС‚Рµ Р»РѕС‚РµСЂРµР№РЅСѓСЋ РєРѕРјР±РёРЅР°С†РёСЋ Рё СЃСѓРјРјСѓ Р»РѕС‚РµСЂРµР№РЅРѕР№ СЃС‚Р°РІРєРё.";

  return (
    <div className="main-container__wrapper">
      <div className="main-container__info">
        <span>{message}</span>
      </div>
    </div>
  );
}

function getResultMessage(result, freeSpinsTotal, freeSpinsLeft) {
  if (freeSpinsTotal > 0)
    return `РџСЂРёР·РѕРІС‹Рµ СЃРїРёРЅС‹: ${freeSpinsLeft}/${freeSpinsTotal}. Р’С‹РёРіСЂС‹С€: ${result.WinSum.toFixed(2)}.`;
  if (result.scatterCount >= 2)
    return `РЎРєР°С‚С‚РµСЂС‹: ${result.scatterCount}. Р’С‹РёРіСЂС‹С€: ${result.WinSum.toFixed(2)}.`;
  if (result.WinSum > 0)
    return `РџРѕР·РґСЂР°РІР»СЏРµРј! Р’Р°С€ РІС‹РёРіСЂС‹С€: ${result.WinSum.toFixed(2)}.`;
  return "Р‘РёР»РµС‚ РЅРµ РІС‹РёРіСЂР°Р». Р’С‹Р±РµСЂРёС‚Рµ РєРѕРјР±РёРЅР°С†РёСЋ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.";
}
