import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const copy = {
  ru: {
    takeMoney: "ЗАБРАТЬ ДЕНЬГИ",
    info: "ИНФО",
    language: "РУССКИЙ",
    menu: "МЕНЮ",
    visualization: "РЕЖИМ\nВИЗУАЛИЗАЦИИ",
    betAmount: "СУММА СТАВКИ",
    double: "\u0423\u0414\u0412\u041e\u0415\u041d\u0418\u0415",
    lotteryCombination: "ЛОТЕРЕЙНАЯ КОМБИНАЦИЯ",
    autoExpress: "АВТО ЭКСПРЕСС",
    participate: "УЧАСТВОВАТЬ\nВ ТИРАЖЕ",
    chooseCoordinateGroup: "ВЫБЕРИТЕ ГРУППУ КООРДИНАТ",
    minimumPurchase: "МИНИМАЛЬНАЯ СУММА ПОКУПКИ 0.10",
    balance: "БАЛАНС",
    purchaseAmount: "СУММА ПОКУПКИ",
    cashback: "КЭШБЕК.",
    lotteryBet: "ЛОТЕРЕЙНАЯ СТАВКА",
    combination: "Комбинация",
    coordinateGroup: "включающая группу",
    coordinates: "координат:",
    orCombination: "или их сочетание",
    winningsTable: "ТАБЛИЦА ВЫИГРЫШЕЙ",
    draw: "ТИРАЖ",
    currentWin: "ТЕКУЩИЙ ВЫИГРЫШ",
    possibleWin: "ВОЗМОЖНЫЙ ВЫИГРЫШ",
    win: "ВЫИГРЫШ",
    lotteryConsent:
      "Выбирая лотерейную комбинацию и совершая лотерейную ставку, Вы подтверждаете свое согласие с действующими правилами проведения лотереи.",
    moreInfo: "Для получения информации\nперейдите в раздел инфо",
    left: "Левая",
    right: "Правая",
    loading: "Загрузка...",
    doubleAmount: "Сумма удвоения",
    preparing: "Подготовка модуля...",
    validating: "Проверка сессии...",
    ready: "Готово",
    processing: "Операция обрабатывается...",
    noGames: "Нет доступных игр",
    somethingWrong: "Что-то пошло не так",
    networkError: "Сетевое соединение прервано",
    sessionExpired: "Сессия истекла",
    unsupported: "Эта среда не поддерживается",
    maintenance: "Модуль временно недоступен",
    invalidSession: "Недействительная сессия",
    accessDenied: "Доступ запрещен",
    configurationError: "Ошибка конфигурации",
    waitingHost: "Ожидание инициализации хоста.",
    openSignedContext:
      "Откройте модуль с действительным подписанным контекстом.",
    retry: "Повторить",
    insufficientBalance: "Недостаточно средств для выбранной комбинации",
    paytableLoadError: "Не удалось загрузить таблицу выплат",
    loadingGames: "Загрузка игр...",
    play: "Играть",
    soon: "Скоро",
    previousGames: "Предыдущие игры",
    nextGames: "Следующие игры",
    gameMenu: "Меню игры",
    close: "Закрыть",
    history: "История",
    rules: "Правила",
    gameHistory: "История тиражей",
    noHistory: "История пока пуста.",
    chooseSide: "Выберите левую или правую сторону",
    superPrize: "Суперприз",
    goldBags: "Золотые мешки",
    freeSpins: "x3 бесплатных тиража",
    freeSpinsRemaining: "Осталось бесплатных тиражей",
    dailyPool: "Ежедневный фонд",
    retryDouble: "Повторите запрос удвоения",
    chooseTicket: "Выберите лотерейную комбинацию и сумму лотерейной ставки.",
    prizeSpins: "Призовые тиражи",
    scatters: "Скаттеры",
    congratulations: "Поздравляем! Ваш выигрыш",
    ticketLost: "Билет не выиграл. Выберите комбинацию и попробуйте еще раз.",
    doubleWon: "выиграла. Удвойте снова или заберите деньги.",
    doubleLost: "проиграла.",
    doubleUnknown:
      "Результат удвоения неизвестен. Проверьте статус перед повтором.",
    initError: "Не удалось инициализировать модуль.",
    spinUnknown:
      "Результат тиража неизвестен. Проверьте статус перед повтором.",
    lotteryMode: "Режим лотереи",
    gameSelect: "Выбор игры",
    visualMode: "Режим визуализации",
    opening: "Открытие",
    gameStatus: "Статус игры",
  },
  tg: {
    takeMoney: "ГИРИФТАНИ ПУЛ",
    info: "МАЪЛУМОТ",
    language: "ТОҶИКӢ",
    menu: "МЕНЮ",
    visualization: "РЕЖИМИ\nНАМОИШ",
    betAmount: "МАБЛАҒИ ШАРТ",
    double: "ДУ БАРОБАР",
    lotteryCombination: "КОМБИНАТСИЯИ ЛОТЕРЕЯ",
    autoExpress: "АВТО ЭКСПРЕСС",
    participate: "ИШТИРОК ДАР\nТИРАЖ",
    chooseCoordinateGroup: "ГУРӮҲИ КООРДИНАТҲОРО ИНТИХОБ КУНЕД",
    minimumPurchase: "ҲАДДИ АҚАЛЛИ ХАРИД 0.10",
    balance: "ТАВОЗУН",
    purchaseAmount: "МАБЛАҒИ ХАРИД",
    cashback: "КЭШБЭК.",
    lotteryBet: "ШАРТИ ЛОТЕРЕЯ",
    combination: "Комбинатсия",
    coordinateGroup: "иборат аз гурӯҳи",
    coordinates: "координатҳо:",
    orCombination: "ё омезиши онҳо",
    winningsTable: "ҶАДВАЛИ БУРДҲО",
    draw: "ТИРАЖ",
    currentWin: "БУРДИ ҶОРӢ",
    possibleWin: "БУРДИ ЭҲТИМОЛӢ",
    win: "БУРД",
    lotteryConsent:
      "Бо интихоби комбинатсияи лотерея ва гузоштани шарт, Шумо розигии худро ба қоидаҳои амалкунандаи баргузории лотерея тасдиқ мекунед.",
    moreInfo: "Барои гирифтани маълумот\nба бахши маълумот гузаред",
    left: "Чап",
    right: "Рост",
    loading: "Боргирӣ...",
    doubleAmount: "Маблағи дучандкунӣ",
    preparing: "Омодасозии модул...",
    validating: "Санҷиши сессия...",
    ready: "Омода",
    processing: "Амалиёт коркард мешавад...",
    noGames: "Бозиҳои дастрас нестанд",
    somethingWrong: "Хатое рух дод",
    networkError: "Пайвасти шабака қатъ шуд",
    sessionExpired: "Муҳлати сессия анҷом ёфт",
    unsupported: "Ин муҳит дастгирӣ намешавад",
    maintenance: "Модул муваққатан дастнорас аст",
    invalidSession: "Сессияи нодуруст",
    accessDenied: "Дастрасӣ манъ аст",
    configurationError: "Хатои танзимот",
    waitingHost: "Интизори оғозёбии хост.",
    openSignedContext: "Модулро бо контексти имзошудаи дуруст кушоед.",
    retry: "Такрор",
    insufficientBalance: "Барои комбинатсияи интихобшуда маблағ кофӣ нест",
    paytableLoadError: "Ҷадвали пардохт бор нашуд",
    loadingGames: "Боргирии бозиҳо...",
    play: "Бозӣ",
    soon: "Ба зудӣ",
    previousGames: "Бозиҳои қаблӣ",
    nextGames: "Бозиҳои баъдӣ",
    gameMenu: "Менюи бозӣ",
    close: "Пӯшидан",
    history: "Таърих",
    rules: "Қоидаҳо",
    gameHistory: "Таърихи тиражҳо",
    noHistory: "Таърих ҳоло холӣ аст.",
    chooseSide: "Тарафи чап ё ростро интихоб кунед",
    superPrize: "Шоҳҷоиза",
    goldBags: "Халтаҳои тилло",
    freeSpins: "x3 тиражи ройгон",
    freeSpinsRemaining: "Тиражҳои ройгони боқимонда",
    dailyPool: "Фонди ҳаррӯза",
    retryDouble: "Дархости дучандкуниро такрор кунед",
    chooseTicket: "Комбинатсияи лотерея ва маблағи шартро интихоб кунед.",
    prizeSpins: "Тиражҳои ҷоизавӣ",
    scatters: "Скаттерҳо",
    congratulations: "Табрик! Бурди шумо",
    ticketLost:
      "Билет бурд накард. Комбинатсияро интихоб карда, бори дигар кӯшиш кунед.",
    doubleWon: "бурд кард. Боз дучанд кунед ё пулро гиред.",
    doubleLost: "бохт.",
    doubleUnknown:
      "Натиҷаи дучандкунӣ номаълум аст. Пеш аз такрор ҳолатро санҷед.",
    initError: "Модул оғоз карда нашуд.",
    spinUnknown: "Натиҷаи тираж номаълум аст. Пеш аз такрор ҳолатро санҷед.",
    lotteryMode: "Реҷаи лотерея",
    gameSelect: "Интихоби бозӣ",
    visualMode: "Реҷаи намоиш",
    opening: "Кушодан",
    gameStatus: "Ҳолати бозӣ",
  },
};

const LanguageContext = createContext(null);
const LANGUAGE_TRANSITION_SILENCE_MS = 180;

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("ru");
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  const selectLanguage = useCallback((nextLanguage) => {
    if (!copy[nextLanguage]) return;
    setIsLanguageChanging(true);
    setLanguage(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    selectLanguage(language === "ru" ? "tg" : "ru");
  }, [language, selectLanguage]);

  useEffect(() => {
    if (!isLanguageChanging) return undefined;

    const timer = window.setTimeout(() => {
      setIsLanguageChanging(false);
    }, LANGUAGE_TRANSITION_SILENCE_MS);

    return () => window.clearTimeout(timer);
  }, [isLanguageChanging, language]);

  const value = useMemo(
    () => ({
      language,
      isLanguageChanging,
      selectLanguage,
      toggleLanguage,
      t: (key) => copy[language][key] ?? copy.ru[key] ?? key,
    }),
    [isLanguageChanging, language, selectLanguage, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
