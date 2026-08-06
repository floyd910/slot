import { useCallback, useEffect, useRef } from "react";

const EFFECT_VOLUME = 0.8;
const TARGET_EFFECT_RMS = 0.18;
const MIN_NORMALIZATION_GAIN = 0.4;
const MAX_NORMALIZATION_GAIN = 3;

const originalMedia = {
  click: "/media/pressing-bet-amount-button.8819b8f6.mp3",
  buttonPress: "/media/button-press-sound.mp3",
  controlClick: "/media/pressing-bet-amount-button.8819b8f6.mp3",
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

const game3Media = {
  ...originalMedia,
  click: "/media/arabic-ui-click.mp3",
  controlClick: "/media/arabic-ui-click.mp3",
  amount: "/media/arabic-ui-click.mp3",
  receiptWin: "/media/game3-total-win-v1.wav",
  cashout: "/media/arabic-cashout.mp3",
  double: "/media/arabic-double.mp3",
  lose: "/media/arabic-lose.mp3",
  freeTickets: "/media/arabic-free-tickets.mp3",
  afterBonus: "/media/arabic-after-bonus.mp3",
  win0: "/media/game3-total-win-v1.wav",
  win12: "/media/game3-total-win-v1.wav",
  win3: "/media/game3-total-win-v1.wav",
  win4: "/media/game3-total-win-v1.wav",
  win5: "/media/game3-total-win-v1.wav",
  win6: "/media/game3-total-win-v1.wav",
  win7: "/media/game3-total-win-v1.wav",
  win8: "/media/game3-total-win-v1.wav",
};

const GAME5_AXE_CLICK_SRC = "/media/game5-axe-click.mp3";
const game5Media = {
  ...originalMedia,
  click: GAME5_AXE_CLICK_SRC,
  buttonPress: GAME5_AXE_CLICK_SRC,
  controlClick: GAME5_AXE_CLICK_SRC,
  amount: GAME5_AXE_CLICK_SRC,
};

const createWinSoundMap = (media) => ({
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
});

const originalWinSoundBySymbol = createWinSoundMap(originalMedia);
const game3WinSoundBySymbol = createWinSoundMap(game3Media);
const game5WinSoundBySymbol = createWinSoundMap(game5Media);
const originalEffectSources = [...new Set(Object.values(originalMedia))];
const game3EffectSources = [
  ...new Set(Object.values(game3Media)),
];
const game5EffectSources = [...new Set(Object.values(game5Media))];
export function useGameAudio(gameId) {
  const useGame3Sounds = gameId === "hiranmandi";
  const useGame5Sounds = gameId === "caravan-spins";
  const media = useGame3Sounds
    ? game3Media
    : useGame5Sounds
      ? game5Media
      : originalMedia;
  const winSoundBySymbol = useGame3Sounds
    ? game3WinSoundBySymbol
    : useGame5Sounds
      ? game5WinSoundBySymbol
      : originalWinSoundBySymbol;
  const effectSources = useGame3Sounds
    ? game3EffectSources
    : useGame5Sounds
      ? game5EffectSources
      : originalEffectSources;
  const cacheRef = useRef(new Map());
  const backgroundRef = useRef(null);
  const activePlaybackRef = useRef(new Set());
  const contextRef = useRef(null);
  const bufferRef = useRef(new Map());
  const bufferPromiseRef = useRef(new Map());
  const normalizationGainRef = useRef(new Map());
  const revealPlaybackRef = useRef(null);
  const masterGainRef = useRef(null);
  const mutedRef = useRef(false);
  const mountedRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    contextRef.current = new AudioContextClass();
    masterGainRef.current = contextRef.current.createGain();
    masterGainRef.current.gain.value = mutedRef.current ? 0 : 1;
    masterGainRef.current.connect(contextRef.current.destination);
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
          let sumSquares = 0;
          let sampleCount = 0;
          let peak = 0;
          const sampleStride = Math.max(
            1,
            Math.floor((decoded.length * decoded.numberOfChannels) / 200000),
          );

          for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
            const samples = decoded.getChannelData(channel);
            for (let index = 0; index < samples.length; index += sampleStride) {
              const absoluteSample = Math.abs(samples[index]);
              peak = Math.max(peak, absoluteSample);
              if (absoluteSample < 0.01) continue;
              sumSquares += absoluteSample * absoluteSample;
              sampleCount += 1;
            }
          }

          const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
          const rmsGain = rms > 0 ? TARGET_EFFECT_RMS / rms : 1;
          const peakSafeGain = peak > 0 ? 0.92 / peak : MAX_NORMALIZATION_GAIN;
          normalizationGainRef.current.set(
            src,
            Math.max(
              MIN_NORMALIZATION_GAIN,
              Math.min(MAX_NORMALIZATION_GAIN, rmsGain, peakSafeGain),
            ),
          );
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
      audio.muted = mutedRef.current;
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
      const normalizationGain = normalizationGainRef.current.get(src) ?? 1;
      gain.gain.value = volume * 0.5 * normalizationGain;
      source.connect(gain).connect(masterGainRef.current ?? context.destination);
      source.start(0);

      const playback = {
        stop: () => {
          try {
            source.stop();
          } catch {
            // Source may already be stopped by the browser.
          }
        },
      };
      activePlaybackRef.current.add(playback);
      source.onended = () => activePlaybackRef.current.delete(playback);

      return playback;
    },
    [getAudioContext],
  );

  const playSrc = useCallback(
    (src, { volume = 1, loop = false, restart = true, preferBuffer = true } = {}) => {
      if (!src) return;
      if (preferBuffer) {
        const buffered = playBuffer(src, { volume, loop });
        if (buffered) return buffered;

        let cancelled = false;
        let resolvedPlayback = null;
        const pendingPlayback = {
          stop: () => {
            cancelled = true;
            resolvedPlayback?.stop?.();
          },
        };
        activePlaybackRef.current.add(pendingPlayback);
        warmBuffer(src).then((decoded) => {
          activePlaybackRef.current.delete(pendingPlayback);
          if (cancelled || !mountedRef.current || !decoded) return;
          resolvedPlayback = playBuffer(src, { volume, loop });
        });
        return pendingPlayback;
      }

      warmBuffer(src);
      const base = getAudio(src);
      const audio = restart ? base.cloneNode(true) : base;
      audio.muted = mutedRef.current;
      audio.volume = volume * 0.5;
      audio.loop = loop;
      if (restart) audio.currentTime = 0;
      const playback = audio.play();
      if (playback?.catch) playback.catch(() => {});
      activePlaybackRef.current.add(audio);
      audio.addEventListener(
        "ended",
        () => activePlaybackRef.current.delete(audio),
        { once: true },
      );
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

  const stopAllAudio = useCallback(() => {
    activePlaybackRef.current.forEach((playback) => {
      if (playback.pause) {
        playback.pause();
        playback.currentTime = 0;
      }
      if (playback.stop) playback.stop();
    });
    activePlaybackRef.current.clear();

    cacheRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (backgroundRef.current?.pause) {
      backgroundRef.current.pause();
      backgroundRef.current.currentTime = 0;
    }
    if (backgroundRef.current?.stop) backgroundRef.current.stop();
    backgroundRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const setMuted = useCallback((muted) => {
    const nextMuted = Boolean(muted);
    mutedRef.current = nextMuted;
    const context = contextRef.current;
    if (context && masterGainRef.current) {
      const gain = masterGainRef.current.gain;
      gain.cancelScheduledValues(context.currentTime);
      gain.value = nextMuted ? 0 : 1;
      gain.setValueAtTime(nextMuted ? 0 : 1, context.currentTime);

      if (!nextMuted && context.state === "suspended") {
        context.resume().catch(() => {});
      }
    }
    cacheRef.current.forEach((audio) => {
      audio.muted = nextMuted;
    });
    activePlaybackRef.current.forEach((playback) => {
      if ("muted" in playback) playback.muted = nextMuted;
    });
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
      if (!mountedRef.current) return;
      if (event === "setMuted") {
        setMuted(payload);
        return;
      }
      if (event === "stopAll") {
        stopAllAudio();
        return;
      }
      unlockAudio();
      if (event === "background")
        playBackground("/media/eldorado-main-theme.39d363ed.mp3");
      if (event === "stopBackground") stopBackground();
      if (event === "click") playSrc(media.click, { volume: EFFECT_VOLUME });
      if (event === "buttonPress") playSrc(media.buttonPress, { volume: EFFECT_VOLUME });
      if (event === "controlClick") playSrc(media.controlClick, { volume: EFFECT_VOLUME });
      if (event === "amount") playSrc(media.amount, { volume: EFFECT_VOLUME });
      if (event === "spin") playSrc(media.spin, { volume: EFFECT_VOLUME });
      if (event === "carpet") playSrc(media.carpet, { volume: EFFECT_VOLUME });
      if (event === "stopReveal") {
        revealPlaybackRef.current?.pause?.();
        revealPlaybackRef.current?.stop?.();
        revealPlaybackRef.current = null;
      }
      if (event === "reveal") {
        revealPlaybackRef.current?.pause?.();
        revealPlaybackRef.current?.stop?.();
        revealPlaybackRef.current = playSrc(media.reveal, {
          volume: EFFECT_VOLUME,
        });
      }
      if (event === "cashout") playSrc(media.cashout, { volume: EFFECT_VOLUME });
      if (event === "double") playSrc(media.double, { volume: EFFECT_VOLUME });
      if (event === "lose") playSrc(media.lose, { volume: EFFECT_VOLUME });
      if (event === "freeTickets") playSrc(media.freeTickets, { volume: EFFECT_VOLUME });
      if (event === "win") {
        const firstSymbol = payload?.lineWins?.[0]?.symbol;
        playSrc(winSoundBySymbol[firstSymbol] ?? media.receiptWin, {
          volume: EFFECT_VOLUME,
        });
      }
    },
    [getAudio, playBackground, playSrc, setMuted, stopAllAudio, stopBackground, winSoundBySymbol],
  );
}
