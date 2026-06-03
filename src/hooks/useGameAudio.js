import { useCallback, useEffect, useRef } from "react";

const media = {
  click: "/media/pressing-bet-amount-button.8819b8f6.mp3",
  buttonPress: "/media/button-press-sound.mp3",
  amount: "/media/pressing-bet-amount-button.8819b8f6.mp3",
  spin: "/media/eldorado-carpet-sound.a486c07e.mp3",
  carpet: "/media/carpet.ogg",
  reveal: "/media/receipt-erase.6a92056f.mp3",
  receiptWin: "/media/receipt-win-drop-sound.11ff43ce.mp3",
  digitShort: "/media/digit-short.82a63348.mp3",
  cashout: "/media/eldorado-breakdown-chests-win.d57fe223.mp3",
  double: "/media/eldorado-breakdown-chests-win.d57fe223.mp3",
  lose: "/media/eldorado-breakdown-chests-loss.3f504635.mp3",
  freeTickets: "/media/eldorado-getting-free-tickets.e179cf46.mp3",
  afterBonus: "/media/eldorado-after-bonus-game.e179cf46.mp3",
  win0: "/media/eldorado-win-sound-0.af398794.mp3",
  win12: "/media/eldorado-win-sound-12.feef7474.mp3",
  win3: "/media/eldorado-win-sound-3.93572e53.mp3",
  win4: "/media/eldorado-win-sound-4.3552ce60.mp3",
  win5: "/media/eldorado-win-sound-5.6a8b0cf6.mp3",
  win6: "/media/eldorado-win-sound-6.ca0cf425.mp3",
  win7: "/media/eldorado-win-sound-7.924ed6af.mp3",
  win8: "/media/eldorado-win-sound-8.131fcfc1.mp3",
};

const winSoundBySymbol = {
  0: media.win0,
  1: media.win12,
  2: media.win12,
  3: media.win3,
  4: media.win4,
  5: media.win5,
  6: media.win6,
  7: media.win7,
  8: media.win8,
  12: media.win12,
};

const effectSources = [...new Set(Object.values(media))];

export function useGameAudio() {
  const cacheRef = useRef(new Map());
  const backgroundRef = useRef(null);
  const contextRef = useRef(null);
  const bufferRef = useRef(new Map());
  const bufferPromiseRef = useRef(new Map());

  const getAudioContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    contextRef.current = new AudioContextClass();
    return contextRef.current;
  }, []);

  const warmBuffer = useCallback(
    (src) => {
      if (!src || bufferRef.current.has(src)) return Promise.resolve(bufferRef.current.get(src));
      if (bufferPromiseRef.current.has(src)) return bufferPromiseRef.current.get(src);

      const context = getAudioContext();
      if (!context) return Promise.resolve(null);

      const promise = fetch(src, { cache: "force-cache" })
        .then((response) => response.arrayBuffer())
        .then((buffer) => context.decodeAudioData(buffer))
        .then((decoded) => {
          bufferRef.current.set(src, decoded);
          return decoded;
        })
        .catch(() => null);

      bufferPromiseRef.current.set(src, promise);
      return promise;
    },
    [getAudioContext],
  );

  const unlockAudio = useCallback(() => {
    const context = getAudioContext();
    if (context?.state === "suspended") {
      context.resume().catch(() => {});
    }
    effectSources.forEach(warmBuffer);
  }, [getAudioContext, warmBuffer]);

  const getAudio = useCallback((src) => {
    if (!cacheRef.current.has(src)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      cacheRef.current.set(src, audio);
    }
    return cacheRef.current.get(src);
  }, []);

  const playBuffer = useCallback(
    (src, { volume = 1, loop = false } = {}) => {
      const context = getAudioContext();
      const buffer = bufferRef.current.get(src);
      if (!context || !buffer) return null;

      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = loop;
      gain.gain.value = volume * 0.5;
      source.connect(gain).connect(context.destination);
      source.start(0);

      return {
        stop: () => source.stop(),
      };
    },
    [getAudioContext],
  );

  const playSrc = useCallback(
    (src, { volume = 1, loop = false, restart = true, preferBuffer = true } = {}) => {
      if (!src) return;
      if (preferBuffer) {
        const buffered = playBuffer(src, { volume, loop });
        if (buffered) return buffered;
      }

      warmBuffer(src);
      const base = getAudio(src);
      const audio = restart ? base.cloneNode(true) : base;
      audio.volume = volume * 0.5;
      audio.loop = loop;
      if (restart) audio.currentTime = 0;
      const playback = audio.play();
      if (playback?.catch) playback.catch(() => {});
      return audio;
    },
    [getAudio, playBuffer, warmBuffer],
  );

  const playBackground = useCallback(
    (src) => {
      if (backgroundRef.current?.src?.includes(src)) return;
      if (backgroundRef.current) {
        backgroundRef.current.pause();
        backgroundRef.current = null;
      }
      backgroundRef.current = playSrc(src, {
        loop: true,
        volume: 0.28,
        restart: false,
        preferBuffer: false,
      });
    },
    [playSrc],
  );

  const stopBackground = useCallback(() => {
    if (!backgroundRef.current) return;
    if (backgroundRef.current.pause) backgroundRef.current.pause();
    if (backgroundRef.current.stop) backgroundRef.current.stop();
    backgroundRef.current = null;
  }, []);

  useEffect(() => {
    effectSources.forEach((src) => {
      const audio = getAudio(src);
      audio.load();
      warmBuffer(src);
    });
  }, [getAudio, warmBuffer]);

  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { capture: true, passive: true });
    window.addEventListener("keydown", unlockAudio, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio, { capture: true });
      window.removeEventListener("keydown", unlockAudio, { capture: true });
    };
  }, [unlockAudio]);

  return useCallback(
    (event, payload) => {
      unlockAudio();
      if (event === "background")
        playBackground("/media/eldorado-main-theme.39d363ed.mp3");
      if (event === "stopBackground") stopBackground();
      if (event === "click") playSrc(media.click, { volume: 0.65 });
      if (event === "buttonPress") playSrc(media.buttonPress, { volume: 1 });
      if (event === "amount") playSrc(media.amount, { volume: 0.75 });
      if (event === "spin") playSrc(media.spin, { volume: 0.9 });
      if (event === "carpet") playSrc(media.carpet, { volume: 1 });
      if (event === "stopReveal") {
        const receipt = getAudio(media.reveal);
        receipt.pause();
        receipt.currentTime = 0;
      }
      if (event === "reveal") {
        const receipt = getAudio(media.reveal);
        receipt.pause();
        receipt.currentTime = 0;
        receipt.volume = 0.4;
        const playback = receipt.play();
        if (playback?.catch) playback.catch(() => {});
      }
      if (event === "cashout") playSrc(media.cashout, { volume: 0.85 });
      if (event === "double") playSrc(media.double, { volume: 0.8 });
      if (event === "lose") playSrc(media.lose, { volume: 0.65 });
      if (event === "freeTickets") playSrc(media.freeTickets, { volume: 0.9 });
      if (event === "win") {
        const firstSymbol = payload?.lineWins?.[0]?.symbol;
        playSrc(winSoundBySymbol[firstSymbol] ?? media.receiptWin, {
          volume: 0.85,
        });
      }
    },
    [getAudio, playBackground, playSrc, stopBackground],
  );
}
