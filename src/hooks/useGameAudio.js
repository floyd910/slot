import { useCallback, useRef } from "react";

const AudioContextCtor = () => window.AudioContext || window.webkitAudioContext;

export function useGameAudio() {
  const contextRef = useRef(null);

  const getContext = useCallback(() => {
    const Context = AudioContextCtor();
    if (!Context) return null;
    if (!contextRef.current) contextRef.current = new Context();
    if (contextRef.current.state === "suspended") contextRef.current.resume();
    return contextRef.current;
  }, []);

  const tone = useCallback(
    ({ frequency, duration = 0.12, type = "sine", gain = 0.045, delay = 0 }) => {
      const audio = getContext();
      if (!audio) return;

      const startsAt = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startsAt);
      envelope.gain.setValueAtTime(0.0001, startsAt);
      envelope.gain.exponentialRampToValueAtTime(gain, startsAt + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);

      oscillator.connect(envelope);
      envelope.connect(audio.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + duration + 0.03);
    },
    [getContext],
  );

  return useCallback(
    (event) => {
      if (event === "click") tone({ frequency: 220, duration: 0.06, type: "square", gain: 0.025 });
      if (event === "spin") {
        [180, 240, 320, 420].forEach((frequency, index) => {
          tone({ frequency, duration: 0.07, type: "triangle", gain: 0.03, delay: index * 0.055 });
        });
      }
      if (event === "win") {
        [440, 554, 659, 880].forEach((frequency, index) => {
          tone({ frequency, duration: 0.13, gain: 0.05, delay: index * 0.08 });
        });
      }
      if (event === "lose") tone({ frequency: 120, duration: 0.18, type: "sawtooth", gain: 0.035 });
      if (event === "cashout") {
        [523, 659, 784].forEach((frequency, index) => {
          tone({ frequency, duration: 0.16, gain: 0.055, delay: index * 0.075 });
        });
      }
      if (event === "double") tone({ frequency: 330, duration: 0.1, type: "triangle", gain: 0.04 });
    },
    [tone],
  );
}
