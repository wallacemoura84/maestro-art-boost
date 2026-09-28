import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export const Route = createFileRoute("/ferramentas-audio")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Ferramentas de Áudio — Maestro Wallace Moura" },
      {
        name: "description",
        content:
          "Gravador de voz online com processamento, calculadora de tempo de leitura, metrônomo e afinador cromático gratuitos.",
      },
      { property: "og:title", content: "Ferramentas de Áudio — Maestro Wallace Moura" },
      {
        property: "og:description",
        content: "Gravador de voz, calculadora de leitura, metrônomo e afinador cromático online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AudioToolsPage,
});

/* ---------- UI helpers ---------- */

function Card({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--at-border)] bg-[var(--at-bg)] p-4 sm:p-6">
      <h2 className="mb-6 text-2xl font-bold sm:text-3xl">
        <span className="mr-2">{icon}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--at-border)] bg-[var(--at-panel)] p-4">
      {title && <h3 className="mb-4 text-base font-bold">{title}</h3>}
      {children}
    </div>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <span className="text-xs text-[var(--at-label)]">{children}</span>
);
const Mono = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`font-mono ${className}`}>{children}</span>
);

function Btn({
  active,
  big,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; big?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md border font-semibold transition-colors ${big ? "px-6 py-3 text-lg" : "px-4 py-2 text-sm"} ${
        active
          ? "border-[var(--at-accent)] bg-[var(--at-accent)] text-[var(--at-accent-fg)]"
          : "border-[var(--at-border)] bg-[var(--at-panel)] text-[var(--at-text)] hover:border-[var(--at-accent)]"
      } ${className}`}
    />
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
  disabled,
  vertical,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  vertical?: boolean;
}) {
  return (
    <label className={`flex ${vertical ? "flex-col items-center" : "flex-col"} gap-1`}>
      <Label>{label}</Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={vertical ? "h-28 w-6 [writing-mode:vertical-lr] [direction:rtl]" : "w-full"}
      />
      <Mono className="text-sm">{display}</Mono>
    </label>
  );
}

function useAudioInputs() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((d) => d.kind === "audioinput"));
  }, []);
  useEffect(() => {
    refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, [refresh]);
  return { devices, refresh };
}

const pad = (n: number) => String(n).padStart(2, "0");
const hms = (totalSec: number) => {
  const s = Math.floor(totalSec);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
const fmtDb = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`;
const dbToGain = (db: number) => Math.pow(10, db / 20);

/* ---------- 1. Gravador ---------- */

const EQ_BANDS = [
  { f: 60, l: "60Hz" },
  { f: 120, l: "120Hz" },
  { f: 250, l: "250Hz" },
  { f: 400, l: "400Hz" },
  { f: 800, l: "800Hz" },
  { f: 1600, l: "1.6kHz" },
  { f: 3200, l: "3.2kHz" },
  { f: 6400, l: "6.4kHz" },
  { f: 10000, l: "10kHz" },
  { f: 14000, l: "14kHz" },
];
const METER_MARKS = [-40, -20, -12, -6, -3, 0];

type RecState = "idle" | "recording" | "paused" | "stopped";

function Recorder() {
  const { devices, refresh } = useAudioInputs();
  const [deviceId, setDeviceId] = useState("");
  const [state, setState] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(-40);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [gate, setGate] = useState(-45);
  const [eq, setEq] = useState<number[]>(EQ_BANDS.map(() => 0));
  const [comp, setComp] = useState({ threshold: -24, ratio: 4, attack: 20, release: 250, makeup: 0 });
  const [format, setFormat] = useState<"wav" | "mp3">("wav");
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef(0);
  const clockRef = useRef({ acc: 0, start: 0 });

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    streamRef.current = null;
    ctxRef.current = null;
    setLevel(-40);
  };
  useEffect(() => cleanup, []);

  const loop = () => {
    const an = analyserRef.current;
    const cv = canvasRef.current;
    if (an) {
      const data = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      const db = 20 * Math.log10(Math.sqrt(sum / data.length) || 1e-8);
      setLevel(Math.max(-40, Math.min(0, db)));
      if (cv && recRef.current?.state === "recording") {
        const g = cv.getContext("2d")!;
        g.fillStyle = "#1a1a1a";
        g.fillRect(0, 0, cv.width, cv.height);
        g.strokeStyle = "#ff8a1f";
        g.lineWidth = 2;
        g.beginPath();
        data.forEach((v, i) => {
          const x = (i / data.length) * cv.width;
          const y = (1 - (v + 1) / 2) * cv.height;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.stroke();
      }
    }
    const c = clockRef.current;
    if (recRef.current?.state === "recording") setElapsed((c.acc + performance.now() - c.start) / 1000);
    rafRef.current = requestAnimationFrame(loop);
  };

  const record = async () => {
    if (state === "paused" && recRef.current) {
      recRef.current.resume();
      clockRef.current.start = performance.now();
      setState("recording");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      refresh();
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(an);
      analyserRef.current = an;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        const dctx = new AudioContext();
        try {
          setBuffer(await dctx.decodeAudioData(await blob.arrayBuffer()));
        } finally {
          dctx.close();
        }
        cleanup();
      };
      recRef.current = rec;
      rec.start(250);
      clockRef.current = { acc: 0, start: performance.now() };
      setElapsed(0);
      setBuffer(null);
      setState("recording");
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      alert("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  };

  const pause = () => {
    if (recRef.current?.state !== "recording") return;
    recRef.current.pause();
    clockRef.current.acc += performance.now() - clockRef.current.start;
    setState("paused");
  };

  const stop = () => {
    if (!recRef.current || recRef.current.state === "inactive") return;
    if (recRef.current.state === "recording") clockRef.current.acc += performance.now() - clockRef.current.start;
    recRef.current.stop();
    setState("stopped");
  };

  const download = async () => {
    if (!buffer) return;
    setBusy(true);
    try {
      const processed = await processAudio(buffer, gate, eq, comp);
      const blob = format === "wav" ? encodeWav(processed) : await encodeMp3(processed);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gravacao.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally {
      setBusy(false);
    }
  };

  const recording = state === "recording";
  const levelPct = ((level + 40) / 40) * 100;

  return (
    <Card icon="🎙" title="Gravador de Voz Online">
      <Panel>
        <label className="flex flex-col gap-1">
          <Label>Microfone</Label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={state === "recording" || state === "paused"}
            className="rounded-md border border-[var(--at-border)] bg-[var(--at-bg)] p-2 text-sm"
          >
            <option value="">Microfone padrão</option>
            {devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Microfone ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4">
          <Label>Nível de entrada</Label>
          <div className="mt-1 h-3 w-full overflow-hidden rounded bg-[var(--at-bg)]">
            <div
              className="h-full transition-[width] duration-75"
              style={{
                width: `${levelPct}%`,
                background: level > -6 ? "var(--at-bad)" : "var(--at-ok)",
              }}
            />
          </div>
          <div className="relative mt-1 h-4 font-mono text-[10px] text-[var(--at-label)]">
            {METER_MARKS.map((m) => (
              <span
                key={m}
                className="absolute -translate-x-1/2"
                style={{ left: `${((m + 40) / 40) * 100}%` }}
              >
                {m} dB
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-4">
        <Btn active={recording} onClick={record} disabled={recording}>
          Gravar
        </Btn>
        <Btn active={state === "paused"} onClick={pause} disabled={!recording}>
          Pausar
        </Btn>
        <Btn active={state === "stopped"} onClick={stop} disabled={!(recording || state === "paused")}>
          Parar
        </Btn>
        <Mono className="text-2xl">{hms(elapsed)}</Mono>
      </div>
      {state === "idle" && <p className="text-sm text-[var(--at-muted)]">Pronto para gravar</p>}

      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="h-28 w-full rounded-lg border border-[var(--at-border)] bg-[var(--at-panel)]"
      />

      <Panel title="Processamento de Áudio">
        <div className="grid gap-4">
          <div className="border-b border-[var(--at-border)] pb-4">
            <h4 className="mb-2 font-semibold">1. Gate</h4>
            <Slider label="Threshold" value={gate} min={-80} max={0} onChange={setGate} display={`${gate} dB`} />
          </div>
          <div className="border-b border-[var(--at-border)] pb-4">
            <h4 className="mb-2 font-semibold">2. Equalizador de 10 Bandas</h4>
            <div className="grid grid-cols-5 gap-4 sm:grid-cols-10">
              {EQ_BANDS.map((b, i) => (
                <Slider
                  key={b.f}
                  vertical
                  label={b.l}
                  value={eq[i]!}
                  min={-12}
                  max={12}
                  step={0.5}
                  display={`${eq[i]!.toFixed(1)} dB`}
                  onChange={(v) => setEq((p) => p.map((x, j) => (j === i ? v : x)))}
                />
              ))}
            </div>
          </div>
          <div className="border-b border-[var(--at-border)] pb-4">
            <h4 className="mb-2 font-semibold">3. Compressor</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Threshold" value={comp.threshold} min={-60} max={0} display={`${comp.threshold} dB`} onChange={(v) => setComp({ ...comp, threshold: v })} />
              <Slider label="Ratio" value={comp.ratio} min={1} max={20} display={`${comp.ratio}:1`} onChange={(v) => setComp({ ...comp, ratio: v })} />
              <Slider label="Attack" value={comp.attack} min={0} max={1000} display={`${comp.attack} ms`} onChange={(v) => setComp({ ...comp, attack: v })} />
              <Slider label="Release" value={comp.release} min={10} max={1000} display={`${comp.release} ms`} onChange={(v) => setComp({ ...comp, release: v })} />
              <Slider label="Makeup Gain" value={comp.makeup} min={0} max={24} step={0.5} display={`${comp.makeup.toFixed(1)} dB`} onChange={(v) => setComp({ ...comp, makeup: v })} />
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--at-border)] pb-4">
            <h4 className="font-semibold">4. Normalizer</h4>
            <div className="text-right">
              <Label>Saída (fixa)</Label>
              <Mono className="ml-2">-1.0 dB</Mono>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">5. Limiter</h4>
            <span className="text-sm text-[var(--at-ok)]">● Ativo</span>
          </div>
        </div>
      </Panel>

      <Panel title="Exportação">
        <div className="flex flex-wrap gap-4">
          <Btn active={format === "wav"} onClick={() => setFormat("wav")}>
            Formato de saída WAV (melhor qualidade)
          </Btn>
          <Btn active={format === "mp3"} onClick={() => setFormat("mp3")}>
            MP3 (320 kbps)
          </Btn>
        </div>
        <Btn big active className="mt-4 w-full" disabled={!buffer || busy} onClick={download}>
          {busy ? "Processando..." : "Baixar Áudio"}
        </Btn>
      </Panel>
    </Card>
  );
}

async function processAudio(
  src: AudioBuffer,
  gateDb: number,
  eq: number[],
  c: { threshold: number; ratio: number; attack: number; release: number; makeup: number },
) {
  const sr = src.sampleRate;
  // Gate (envelope por janela de 10 ms)
  const gated = new AudioBuffer({ length: src.length, numberOfChannels: src.numberOfChannels, sampleRate: sr });
  const win = Math.max(1, Math.floor(sr * 0.01));
  const thr = dbToGain(gateDb);
  for (let ch = 0; ch < src.numberOfChannels; ch++) {
    const input = src.getChannelData(ch);
    const out = gated.getChannelData(ch);
    for (let i = 0; i < input.length; i += win) {
      let sum = 0;
      const end = Math.min(input.length, i + win);
      for (let j = i; j < end; j++) sum += input[j]! * input[j]!;
      const open = Math.sqrt(sum / (end - i)) >= thr;
      for (let j = i; j < end; j++) out[j] = open ? input[j]! : 0;
    }
  }
  const off = new OfflineAudioContext(src.numberOfChannels, src.length, sr);
  const node = off.createBufferSource();
  node.buffer = gated;
  let last: AudioNode = node;
  EQ_BANDS.forEach((b, i) => {
    const f = off.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = Math.min(b.f, sr / 2 - 1);
    f.Q.value = 1.4;
    f.gain.value = eq[i]!;
    last.connect(f);
    last = f;
  });
  const comp = off.createDynamicsCompressor();
  comp.threshold.value = c.threshold;
  comp.ratio.value = c.ratio;
  comp.attack.value = c.attack / 1000;
  comp.release.value = c.release / 1000;
  comp.knee.value = 6;
  const makeup = off.createGain();
  makeup.gain.value = dbToGain(c.makeup);
  const limiter = off.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;
  last.connect(comp).connect(makeup).connect(limiter).connect(off.destination);
  node.start();
  const rendered = await off.startRendering();
  // Normalizer: pico em -1.0 dB
  let peak = 0;
  for (let ch = 0; ch < rendered.numberOfChannels; ch++)
    for (const v of rendered.getChannelData(ch)) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) {
    const g = dbToGain(-1) / peak;
    for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
      const d = rendered.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = d[i]! * g;
    }
  }
  return rendered;
}

function toInt16(d: Float32Array) {
  const out = new Int16Array(d.length);
  for (let i = 0; i < d.length; i++) {
    const s = Math.max(-1, Math.min(1, d[i]!));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeWav(buf: AudioBuffer) {
  const ch = buf.numberOfChannels;
  const chans = Array.from({ length: ch }, (_, i) => toInt16(buf.getChannelData(i)));
  const dataLen = buf.length * ch * 2;
  const view = new DataView(new ArrayBuffer(44 + dataLen));
  const w = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, buf.sampleRate, true);
  view.setUint32(28, buf.sampleRate * ch * 2, true);
  view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, dataLen, true);
  let o = 44;
  for (let i = 0; i < buf.length; i++)
    for (let c = 0; c < ch; c++, o += 2) view.setInt16(o, chans[c]![i]!, true);
  return new Blob([view], { type: "audio/wav" });
}

async function encodeMp3(buf: AudioBuffer) {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const ch = Math.min(2, buf.numberOfChannels);
  const enc = new Mp3Encoder(ch, buf.sampleRate, 320);
  const left = toInt16(buf.getChannelData(0));
  const right = ch > 1 ? toInt16(buf.getChannelData(1)) : undefined;
  const parts: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += 1152) {
    const l = left.subarray(i, i + 1152);
    const out = right ? enc.encodeBuffer(l, right.subarray(i, i + 1152)) : enc.encodeBuffer(l);
    if (out.length) parts.push(new Uint8Array(out));
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end));
  return new Blob(parts as BlobPart[], { type: "audio/mpeg" });
}

/* ---------- 2. Calculadora ---------- */

const PACES = [
  { id: "slow", emoji: "🐢", name: "Pausado", ppm: 130, desc: "ideal para narração dramática" },
  { id: "normal", emoji: "🎙", name: "Normal", ppm: 150, desc: "padrão recomendado" },
  { id: "fast", emoji: "⚡", name: "Rápido", ppm: 180, desc: "para locução dinâmica" },
];

function ReadingCalculator() {
  const [text, setText] = useState("");
  const [pace, setPace] = useState(PACES[1]!);
  const [result, setResult] = useState<number | null>(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const empty = text.length === 0;
  const secs = result ?? 0;
  const s = Math.round(secs);

  return (
    <Card icon="🎙" title="Calculadora de Tempo de Leitura">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        placeholder="Cole seu texto aqui"
        rows={8}
        className="w-full rounded-lg border border-[var(--at-border)] bg-[var(--at-panel)] p-4 text-[var(--at-text)]"
      />
      <div className="flex flex-wrap gap-6 text-sm">
        <span>
          Total de Palavras: <Mono>{words}</Mono>
        </span>
        <span>
          Total de Caracteres: <Mono>{text.length}</Mono>
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {PACES.map((p) => (
          <Btn
            key={p.id}
            active={pace.id === p.id}
            onClick={() => {
              setPace(p);
              setResult(null);
            }}
          >
            {p.emoji} {p.name} (<Mono>{p.ppm}</Mono> ppm)
          </Btn>
        ))}
      </div>
      <p className="text-sm text-[var(--at-label)]">{pace.desc}</p>
      <Btn big active disabled={empty} onClick={() => setResult((words / pace.ppm) * 60)}>
        Calcular Tempo de Leitura
      </Btn>
      <div className={`rounded-lg border border-[var(--at-border)] bg-[var(--at-panel)] p-4 text-lg ${empty ? "opacity-50" : ""}`}>
        ⏳ Estimativa de Tempo:{" "}
        <Mono>
          {pad(Math.floor(s / 3600))}h {pad(Math.floor((s % 3600) / 60))}min {pad(s % 60)}s
        </Mono>
      </div>
    </Card>
  );
}

/* ---------- 3. Metrônomo ---------- */

const METERS = [
  { id: "1/4", beats: 1, desc: "um tempo" },
  { id: "2/4", beats: 2, desc: "dois tempos" },
  { id: "3/4", beats: 3, desc: "três tempos" },
  { id: "4/4", beats: 4, desc: "quatro tempos" },
  { id: "6/8", beats: 6, desc: "seis tempos" },
  { id: "9/8", beats: 9, desc: "nove tempos" },
  { id: "12/8", beats: 12, desc: "doze tempos" },
];
const SOUNDS = [
  { id: "click", name: "Clique (padrão)" },
  { id: "bell", name: "Sino" },
  { id: "wood", name: "Madeira" },
  { id: "cowbell", name: "Cowbell" },
];

function playTick(ctx: AudioContext, time: number, sound: string, volume: number, accent: boolean) {
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const v = volume * (accent ? 1 : 0.7);
  const env = (dur: number) => {
    out.gain.setValueAtTime(v, time);
    out.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  };
  const osc = (type: OscillatorType, freq: number, dur: number, dest: AudioNode = out) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(dest);
    o.start(time);
    o.stop(time + dur);
  };
  const k = accent ? 1.5 : 1;
  if (sound === "bell") {
    env(0.6);
    osc("sine", 2000 * k, 0.6);
    osc("sine", 3000 * k, 0.4);
  } else if (sound === "wood") {
    env(0.06);
    osc("triangle", 500 * k, 0.06);
  } else if (sound === "cowbell") {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2640;
    bp.connect(out);
    env(0.25);
    osc("square", 540 * (accent ? 1.2 : 1), 0.25, bp);
    osc("square", 800 * (accent ? 1.2 : 1), 0.25, bp);
  } else {
    env(0.03);
    osc("square", 1000 * k, 0.03);
  }
}

function Metronome() {
  const [bpm, setBpm] = useState(60);
  const [meter, setMeter] = useState(METERS.find((m) => m.id === "3/4")!);
  const [volume, setVolume] = useState(70);
  const [sound, setSound] = useState("click");
  const [status, setStatus] = useState<"stopped" | "playing" | "paused">("stopped");
  const [beat, setBeat] = useState(0);
  const [pulse, setPulse] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>(0);
  const nextRef = useRef({ time: 0, beat: 0 });
  const live = useRef({ sound, volume });
  live.current = { sound, volume };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    ctxRef.current?.close();
  }, []);

  const start = () => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    ctx.resume();
    nextRef.current.time = ctx.currentTime + 0.05;
    const interval = 60 / bpm;
    timerRef.current = window.setInterval(() => {
      while (nextRef.current.time < ctx.currentTime + 0.1) {
        const b = nextRef.current.beat;
        const t = nextRef.current.time;
        playTick(ctx, t, live.current.sound, live.current.volume / 100, b === 0);
        const delay = Math.max(0, (t - ctx.currentTime) * 1000);
        setTimeout(() => {
          setBeat(b + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 100);
        }, delay);
        nextRef.current.beat = (b + 1) % meter.beats;
        nextRef.current.time += interval;
      }
    }, 25);
    setStatus("playing");
  };

  const pause = () => {
    clearInterval(timerRef.current);
    setStatus("paused");
  };
  const stop = () => {
    clearInterval(timerRef.current);
    nextRef.current.beat = 0;
    setBeat(0);
    setStatus("stopped");
  };
  const playing = status === "playing";

  return (
    <Card icon="🎵" title="Metrônomo Profissional">
      <div className="text-center">
        <Mono className="text-6xl font-bold sm:text-7xl">{bpm}</Mono>
        <span className="ml-2 text-[var(--at-label)]">bpm</span>
      </div>
      <Slider label="Andamento" value={bpm} min={40} max={300} display={`${bpm} bpm`} onChange={setBpm} disabled={playing} />
      <Panel title="Compasso">
        <div className="flex flex-wrap gap-4">
          {METERS.map((m) => (
            <Btn
              key={m.id}
              active={meter.id === m.id}
              disabled={playing}
              onClick={() => {
                setMeter(m);
                nextRef.current.beat = 0;
                setBeat(0);
              }}
            >
              <Mono>{m.id}</Mono>
            </Btn>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--at-label)]">{meter.desc}</p>
      </Panel>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="🔊 Volume" value={volume} min={0} max={100} display={`Volume: ${volume}%`} onChange={setVolume} />
          <label className="flex flex-col gap-1">
            <Label>Som</Label>
            <select
              value={sound}
              onChange={(e) => setSound(e.target.value)}
              className="rounded-md border border-[var(--at-border)] bg-[var(--at-bg)] p-2 text-sm"
            >
              {SOUNDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>
      <div className="flex flex-wrap items-center gap-4">
        <Btn big active onClick={playing ? pause : start}>
          {playing ? "⏸ Pausar" : "▶ Iniciar"}
        </Btn>
        <Btn onClick={stop} disabled={status === "stopped"}>
          ⏹ Parar
        </Btn>
        <span className="text-lg">
          Tempo: <Mono>{beat}/{meter.beats}</Mono>
        </span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: meter.beats }, (_, i) => (
          <div
            key={i}
            className="h-4 flex-1 rounded transition-colors duration-75"
            style={{
              background: beat === i + 1 && pulse ? "var(--at-accent)" : "var(--at-panel)",
              border: "1px solid var(--at-border)",
            }}
          />
        ))}
      </div>
    </Card>
  );
}

/* ---------- 4. Afinador ---------- */

const GUITAR_STRINGS = [
  { label: "6ª", note: "E2", midi: 40 },
  { label: "5ª", note: "A2", midi: 45 },
  { label: "4ª", note: "D3", midi: 50 },
  { label: "3ª", note: "G3", midi: 55 },
  { label: "2ª", note: "B3", midi: 59 },
  { label: "1ª", note: "E4", midi: 64 },
];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function detectPitch(buf: Float32Array, sr: number, rmsThr: number) {
  let rms = 0;
  for (const v of buf) rms += v * v;
  if (Math.sqrt(rms / buf.length) < rmsThr) return -1;
  const n = buf.length;
  const c = new Float32Array(n);
  for (let lag = 0; lag < n; lag++) {
    let s = 0;
    for (let i = 0; i < n - lag; i++) s += buf[i]! * buf[i + lag]!;
    c[lag] = s;
  }
  let d = 0;
  while (d < n - 1 && c[d]! > c[d + 1]!) d++;
  let maxV = -1,
    maxP = -1;
  for (let i = d; i < n; i++)
    if (c[i]! > maxV) {
      maxV = c[i]!;
      maxP = i;
    }
  if (maxP <= 0) return -1;
  const x1 = c[maxP - 1] ?? 0,
    x2 = c[maxP],
    x3 = c[maxP + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2!) / 2;
  const b = (x3 - x1) / 2;
  const T = a ? maxP - b / (2 * a) : maxP;
  const f = sr / T;
  return f > 25 && f < 4200 ? f : -1;
}

function Tuner() {
  const { devices, refresh } = useAudioInputs();
  const [deviceId, setDeviceId] = useState("");
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(false);
  const [sens, setSens] = useState(5);
  const [reading, setReading] = useState<{ note: string; freq: number; cents: number } | null>(null);
  const [history, setHistory] = useState<{ note: string; freq: number }[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef(0);
  const sensRef = useRef(sens);
  sensRef.current = sens;
  const [refA, setRefA] = useState(440);
  const refARef = useRef(refA);
  refARef.current = refA;
  const [mode, setMode] = useState<"la" | "violao">("violao");
  const [toneOn, setToneOn] = useState(false);
  const toneRef = useRef<{ ctx: AudioContext; osc: OscillatorNode } | null>(null);
  const stopTone = () => {
    toneRef.current?.osc.stop();
    toneRef.current?.ctx.close();
    toneRef.current = null;
    setToneOn(false);
  };
  const startTone = (freq: number) => {
    stopTone();
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.25;
    osc.frequency.value = freq;
    osc.connect(g).connect(ctx.destination);
    osc.start();
    toneRef.current = { ctx, osc };
    setToneOn(true);
  };
  useEffect(() => {
    if (toneRef.current) toneRef.current.osc.frequency.value = refA;
  }, [refA]);
  useEffect(() => stopTone, []);
  const lastNote = useRef("");

  useEffect(() => {
    setConnected(devices.length > 0 && devices.some((d) => d.deviceId !== ""));
  }, [devices]);

  const stopDetect = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    streamRef.current = null;
    ctxRef.current = null;
    setActive(false);
  };
  useEffect(() => stopDetect, []);

  const startDetect = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      setConnected(true);
      refresh();
      stream.getTracks().forEach((t) => (t.onended = () => {
        setConnected(false);
        stopDetect();
      }));
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      setHistory([]);
      lastNote.current = "";
      setReading(null);
      setActive(true);
      timerRef.current = window.setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const thr = 0.004 + (10 - sensRef.current) * 0.004;
        const f = detectPitch(buf, ctx.sampleRate, thr);
        if (f < 0) return;
        const midi = Math.round(69 + 12 * Math.log2(f / refARef.current));
        const ref = refARef.current * Math.pow(2, (midi - 69) / 12);
        const cents = 1200 * Math.log2(f / ref);
        const note = `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
        setReading({ note, freq: f, cents });
        if (note !== lastNote.current) {
          lastNote.current = note;
          setHistory((h) => [{ note, freq: f }, ...h].slice(0, 5));
        }
      }, 100);
    } catch {
      setConnected(false);
      alert("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  };

  const cents = reading ? Math.max(-50, Math.min(50, reading.cents)) : 0;
  const rc = reading ? Math.round(reading.cents) : 0;
  const status = !reading
    ? null
    : Math.abs(reading.cents) <= 5
      ? { t: "✓ Afinado!", c: "var(--at-ok)" }
      : reading.cents > 5
        ? { t: "⬆ Muito agudo", c: "var(--at-bad)" }
        : { t: "⬇ Muito grave", c: "var(--at-bad)" };

  return (
    <Card icon="🎸" title="Afinador Cromático">
      <div className="flex flex-wrap gap-4">
        <Btn active={mode === "la"} onClick={() => setMode("la")}>🎼 Diapasão (Lá)</Btn>
        <Btn active={mode === "violao"} onClick={() => { setMode("violao"); stopTone(); }}>🎸 Afinador de violão</Btn>
      </div>
      <Panel title="Afinação de referência (Lá)">
        <div className="flex flex-wrap gap-4">
          {[415, 432, 440, 442].map((hz) => (
            <Btn key={hz} active={refA === hz} onClick={() => setRefA(hz)}>
              Lá = <Mono>{hz}</Mono> Hz
            </Btn>
          ))}
        </div>
      </Panel>
      {mode === "la" ? (
        <div className="rounded-lg border border-[var(--at-border)] bg-[var(--at-panel)] p-6 text-center">
          <Mono className="block text-7xl font-bold">A4</Mono>
          <Mono className="mt-2 block text-xl">{refA.toFixed(2)} Hz</Mono>
          <Btn big active className="mt-4" onClick={() => (toneOn ? stopTone() : startTone(refA))}>
            {toneOn ? "⏹ Parar Lá" : "▶ Tocar Lá"}
          </Btn>
        </div>
      ) : (
      <>
      <Panel>
        <label className="flex flex-col gap-1">
          <Label>Entrada de áudio</Label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={active}
            className="rounded-md border border-[var(--at-border)] bg-[var(--at-bg)] p-2 text-sm"
          >
            <option value="">Selecionar microfone...</option>
            {devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Microfone ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-sm" style={{ color: connected ? "var(--at-ok)" : "var(--at-bad)" }}>
          {connected ? "🎤 Microfone conectado" : "❌ Sem microfone"}
        </p>
      </Panel>

      <div className="rounded-lg border border-[var(--at-border)] bg-[var(--at-panel)] p-6 text-center">
        <Mono className="block text-7xl font-bold">{reading?.note ?? "--"}</Mono>
        <Mono className="mt-2 block text-xl">{reading ? `${reading.freq.toFixed(2)} Hz` : "0.00 Hz"}</Mono>
        <p className="mt-2 h-7 text-lg font-semibold" style={{ color: status?.c }}>
          {status?.t}
        </p>
        <div
          className="relative mx-auto mt-4 h-6 w-full max-w-xl rounded"
          style={{ background: "linear-gradient(90deg, var(--at-bad), var(--at-ok) 45%, var(--at-ok) 55%, var(--at-bad))" }}
        >
          <div
            className="absolute -top-1 h-8 w-1 -translate-x-1/2 rounded bg-[var(--at-text)] transition-[left] duration-100"
            style={{ left: `${((cents + 50) / 100) * 100}%` }}
          />
        </div>
        <div className="mx-auto flex max-w-xl justify-between font-mono text-xs text-[var(--at-label)]">
          <span>-50 cents</span>
          <span>0</span>
          <span>+50 cents</span>
        </div>
        <p className="mt-2">
          Desvio: <Mono>{rc > 0 ? `+${rc}` : rc} cents</Mono>
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {GUITAR_STRINGS.map((st) => {
          const hz = refA * Math.pow(2, (st.midi - 69) / 12);
          const on = reading?.note === st.note;
          return (
            <div key={st.note} className="rounded-md border p-2 text-center" style={{ borderColor: on ? "var(--at-accent)" : "var(--at-border)", background: on ? "var(--at-accent)" : "var(--at-panel)", color: on ? "var(--at-accent-fg)" : undefined }}>
              <div className="text-xs">{st.label}</div>
              <Mono className="block text-lg font-bold">{st.note}</Mono>
              <Mono className="block text-[10px]">{hz.toFixed(2)} Hz</Mono>
            </div>
          );
        })}
      </div>
      <Panel title="Histórico de Afinação">
        <Mono className="text-sm">
          {history.length ? history.map((h) => `${h.note} @ ${h.freq.toFixed(2)} Hz`).join(" | ") : "—"}
        </Mono>
      </Panel>

      <div className="flex flex-col gap-4">
        <Btn big active onClick={active ? stopDetect : startDetect}>
          {active ? "⏹ Parar Detecção" : "🎤 Iniciar Detecção"}
        </Btn>
        <div>
          <Slider label={`Sensibilidade: ${sens}`} value={sens} min={1} max={10} display={String(sens)} onChange={setSens} />
          <p className="text-xs text-[var(--at-label)]">1 = menor ruído capturado, 10 = maior sensibilidade</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Página ---------- */

function AudioToolsPage() {
  return (
    <div className="audio-tools min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <a href="/" className="text-sm text-[var(--at-label)] hover:text-[var(--at-text)]">
          ← Maestro Wallace Moura
        </a>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-12">
        <h1 className="text-4xl font-bold">Ferramentas de Áudio</h1>
        <Recorder />
        <ReadingCalculator />
        <Metronome />
        <Tuner />
      </main>
      <footer className="pb-8 text-center text-xs text-[var(--at-muted)]">
        © Wallace Moura - Desenvolvido com Lovable
      </footer>
    </div>
  );
}
