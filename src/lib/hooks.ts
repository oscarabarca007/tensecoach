import { useCallback, useEffect, useRef, useState } from "react";
import { Recorder, type Recording } from "./recorder";
import { addPracticeSeconds } from "./storage";
import { stopSpeaking } from "./tts";

/** Adds time to today's practice total while the calling screen is visible. */
export function usePracticeClock() {
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") addPracticeSeconds(5);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);
}

/** Tap-to-start / tap-to-stop microphone with an automatic stop after maxSeconds. */
export function useRecorder(onDone: (r: Recording) => void, onError: (msg: string) => void, maxSeconds = 45) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<Recorder | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const cb = useRef({ onDone, onError });
  cb.current = { onDone, onError };

  const stop = useCallback(async () => {
    window.clearInterval(timer.current);
    const r = rec.current;
    rec.current = null;
    setRecording(false);
    if (!r) return;
    try {
      const audio = await r.stop();
      if (audio.seconds < 0.6) cb.current.onError("La grabación fue muy corta. Toca, habla y luego toca otra vez para terminar.");
      else cb.current.onDone(audio);
    } catch (e) {
      cb.current.onError(`No pude procesar el audio: ${(e as Error)?.message ?? e}`);
    }
  }, []);

  const start = useCallback(async () => {
    stopSpeaking();
    const r = new Recorder();
    try {
      await r.start();
    } catch {
      cb.current.onError("No pude acceder al micrófono. Da permiso de micrófono a la app o usa «Escribir».");
      return;
    }
    rec.current = r;
    setElapsed(0);
    setRecording(true);
    const t0 = Date.now();
    timer.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      setElapsed(s);
      if (s >= maxSeconds) void stop();
    }, 250);
  }, [maxSeconds, stop]);

  useEffect(
    () => () => {
      rec.current?.cancel();
      window.clearInterval(timer.current);
    },
    []
  );

  return { recording, elapsed, start, stop };
}
