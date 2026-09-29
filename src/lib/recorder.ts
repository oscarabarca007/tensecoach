// Records the microphone and converts it to 16 kHz mono WAV, a format every
// Gemini model accepts and small enough to send inline (~32 KB per second).

export interface Recording {
  base64: string;
  mimeType: "audio/wav";
  seconds: number;
}

export class Recorder {
  private media?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private started = 0;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });
    this.chunks = [];
    this.media = new MediaRecorder(this.stream);
    this.media.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.media.start();
    this.started = performance.now();
  }

  get recording() {
    return this.media?.state === "recording";
  }

  async stop(): Promise<Recording> {
    const media = this.media;
    if (!media) throw new Error("No hay grabación activa");
    const done = new Promise<void>((r) => (media.onstop = () => r()));
    media.stop();
    await done;
    this.stream?.getTracks().forEach((t) => t.stop());
    const seconds = (performance.now() - this.started) / 1000;
    const blob = new Blob(this.chunks, { type: media.mimeType });
    const wav = await toWav16k(blob);
    return { base64: await blobToBase64(wav), mimeType: "audio/wav", seconds };
  }

  cancel() {
    if (this.media && this.media.state !== "inactive") this.media.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}

async function toWav16k(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buf);
  void ctx.close();
  const rate = 16000;
  const length = Math.max(1, Math.ceil(decoded.duration * rate));
  const off = new OfflineAudioContext(1, length, rate);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return encodeWav(rendered.getChannelData(0), rate);
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
