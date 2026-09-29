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
