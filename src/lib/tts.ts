let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null; // not loaded yet; try again next call
  cachedVoice =
    voices.find((v) => v.lang === "en-US" && /google/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
  return cachedVoice;
}

export const ttsAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, rate = 0.95) {
  if (!ttsAvailable() || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const v = pickVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (ttsAvailable()) speechSynthesis.cancel();
}

/**
 * English voices for dialogues, one per speaker: US first, then other accents
 * (international teams sound like this), one voice per locale so speakers differ.
 */
function dialogueVoices(): SpeechSynthesisVoice[] {
  const en = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  const order = ["en-us", "en-gb", "en-au", "en-in", "en-ca", "en-ie", "en-za", "en-nz"];
  const rank = (v: SpeechSynthesisVoice) => {
    const i = order.indexOf(v.lang.toLowerCase().replace("_", "-"));
    return (i < 0 ? order.length : i) * 2 + (/google/i.test(v.name) ? 0 : 1);
  };
  const sorted = [...en].sort((a, b) => rank(a) - rank(b));
  const perLocale: SpeechSynthesisVoice[] = [];
  const seen = new Set<string>();
  for (const v of sorted) {
    if (!seen.has(v.lang)) {
      seen.add(v.lang);
      perLocale.push(v);
    }
  }
  // Fall back to extra voices of the same locale if there are fewer locales than speakers.
  return [...perLocale, ...sorted.filter((v) => !perLocale.includes(v))];
}

/** Pitch offsets so speakers still sound different when the device has a single English voice. */
const PITCH = [1, 0.8, 1.2];

/**
 * Reads a dialogue line by line. `onLine` fires as each line starts (with its index),
 * `onEnd` once at the end or on stop. Returns a function that stops playback.
 */
export function playDialogue(
  lines: { s: number; text: string }[],
  { rate, startAt = 0, onLine, onEnd }: { rate: number; startAt?: number; onLine: (i: number) => void; onEnd: () => void }
): () => void {
  if (!ttsAvailable() || !lines.length) {
    onEnd();
    return () => {};
  }
  speechSynthesis.cancel();
  const voices = dialogueVoices();
  const speakers = Math.max(...lines.map((l) => l.s)) + 1;
  const distinct = voices.length >= speakers;
  let finished = false;
  const finish = () => {
    if (!finished) {
      finished = true;
      onEnd();
    }
  };

  lines.slice(startAt).forEach((line, k) => {
    const i = startAt + k;
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = "en-US";
    u.rate = rate;
    if (voices.length) {
      u.voice = voices[line.s % voices.length];
      u.lang = u.voice.lang;
    }
    if (!distinct) u.pitch = PITCH[line.s % PITCH.length];
    u.onstart = () => onLine(i);
    if (i === lines.length - 1) u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
  });

  return () => {
    speechSynthesis.cancel();
    finish();
  };
}
