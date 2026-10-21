/*
 * Converte uma partitura do exsurge em eventos de nota, toca esses eventos
 * no navegador (Web Audio + soundfonts) e gera um arquivo .mid.
 *
 * O exsurge e o soundfont-player são carregados como scripts globais
 * (public/vendor/exsurge.min.js e unpkg), só no navegador.
 */

/* ---------- tipos mínimos do exsurge ---------- */

export interface ExsurgeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExsurgeNote {
  pitch: { toInt(): number } | null;
  morae?: unknown[];
  epismata?: unknown[];
  bounds: ExsurgeRect;
}

export interface ExsurgeNotation {
  isNeume?: boolean;
  isDivider?: boolean;
  notes?: ExsurgeNote[];
  bounds: ExsurgeRect;
}

export interface ExsurgeLine {
  notationsStartIndex: number;
  numNotationsOnLine: number;
  bounds: ExsurgeRect;
}

export interface ExsurgeScore {
  notations: ExsurgeNotation[];
  lines: ExsurgeLine[];
  bounds: ExsurgeRect;
  annotation: unknown;
  performLayoutAsync(ctxt: ExsurgeContext, done: () => void): void;
  layoutChantLines(ctxt: ExsurgeContext, width: number, done: () => void): void;
  createSvg(ctxt: ExsurgeContext): string;
}

export interface ExsurgeContext {
  staffInterval: number;
  lyricTextFont: string;
  lyricTextSize: number;
  lyricTextColor: string;
  dropCapTextFont: string;
  dropCapTextSize: number;
  dropCapTextColor: string;
  annotationTextFont: string;
  annotationTextSize: number;
  annotationTextColor: string;
  neumeLineColor: string;
  staffLineColor: string;
  dividerLineColor: string;
}

type Construtor<T> = new (...args: never[]) => T;

export interface ExsurgeLib {
  ChantContext: new () => ExsurgeContext;
  ChantScore: new (ctxt: ExsurgeContext, mappings: unknown, useDropCap: boolean) => ExsurgeScore;
  Annotation: new (ctxt: ExsurgeContext, text: string) => unknown;
  Gabc: { createMappingsFromSource(ctxt: ExsurgeContext, source: string): unknown };
  DoubleBar: Construtor<ExsurgeNotation>;
  FullBar: Construtor<ExsurgeNotation>;
  HalfBar: Construtor<ExsurgeNotation>;
  QuarterBar: Construtor<ExsurgeNotation>;
  Virgula: Construtor<ExsurgeNotation>;
}

interface SoundfontPlayer {
  play(note: number, when: number, options: { duration: number }): unknown;
  stop(): void;
}

interface SoundfontLib {
  instrument(
    ac: AudioContext,
    name: string,
    options: { soundfont: string; format: string; gain: number },
  ): Promise<SoundfontPlayer>;
}

declare global {
  interface Window {
    exsurge?: ExsurgeLib;
    Soundfont?: SoundfontLib;
    webkitAudioContext?: typeof AudioContext;
  }
}

/* ---------- carregamento de scripts ---------- */

const scriptsCarregando = new Map<string, Promise<void>>();

export function carregarScript(src: string): Promise<void> {
  const existente = scriptsCarregando.get(src);
  if (existente) return existente;
  const promessa = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      scriptsCarregando.delete(src);
      reject(new Error(`Falha ao carregar ${src}`));
    };
    document.head.appendChild(el);
  });
  scriptsCarregando.set(src, promessa);
  return promessa;
}

export const URL_EXSURGE = "/vendor/exsurge.min.js";
export const URL_SOUNDFONT =
  "https://unpkg.com/soundfont-player@0.12.0/dist/soundfont-player.min.js";

/* ---------- eventos ---------- */

export interface EventoNota {
  midi: number;
  inicio: number; // em pulsos
  duracao: number; // em pulsos
  nota: ExsurgeNote;
  notacao: ExsurgeNotation;
  indiceNotacao: number;
}

// Do na clave padrão do exsurge (oitava 2) vira Dó central (MIDI 60).
const DESLOCAMENTO_MIDI = 36;

// Duração, em pulsos, das pausas depois de cada tipo de divisão.
function pausaDaDivisao(ex: ExsurgeLib, n: object): number {
  if (n instanceof ex.DoubleBar) return 2.5;
  if (n instanceof ex.FullBar) return 2;
  if (n instanceof ex.HalfBar) return 1;
  if (n instanceof ex.QuarterBar) return 0.5;
  if (n instanceof ex.Virgula) return 0.5;
  return 0;
}

/*
 * Cada nota vale 1 pulso; o ponto (mora) dobra a nota e o episema
 * horizontal alonga em 50%.
 */
export function extrairEventos(
  ex: ExsurgeLib,
  score: ExsurgeScore,
  transposicao: number,
): EventoNota[] {
  const eventos: EventoNota[] = [];
  let t = 0;

  score.notations.forEach((n, indice) => {
    if (n.isNeume && n.notes) {
      for (const nota of n.notes) {
        if (!nota.pitch) continue;
        let dur = 1;
        if (nota.morae && nota.morae.length) dur = 2;
        else if (nota.epismata && nota.epismata.length) dur = 1.5;
        eventos.push({
          midi: nota.pitch.toInt() + DESLOCAMENTO_MIDI + transposicao,
          inicio: t,
          duracao: dur,
          nota,
          notacao: n,
          indiceNotacao: indice,
        });
        t += dur;
      }
    } else if (n.isDivider) {
      t += pausaDaDivisao(ex, n);
    }
  });

  return eventos;
}

/* ---------- arquivo MIDI (formato 0; um pulso = uma colcheia) ---------- */

const TICKS_POR_SEMINIMA = 480;
const TICKS_POR_PULSO = 240;

function vlq(valor: number): number[] {
  const bytes = [valor & 0x7f];
  valor >>= 7;
  while (valor > 0) {
    bytes.unshift((valor & 0x7f) | 0x80);
    valor >>= 7;
  }
  return bytes;
}

export function gerarMidi(
  eventos: EventoNota[],
  opcoes: { bpm: number; programa: number; titulo: string },
): Uint8Array {
  const usPorSeminima = Math.round(((2 * 60) / opcoes.bpm) * 1e6);

  // [tick, prioridade (note off antes de note on), bytes]
  const lista: [number, number, number[]][] = [];
  for (const e of eventos) {
    const ini = Math.round(e.inicio * TICKS_POR_PULSO);
    const fim = Math.round((e.inicio + e.duracao) * TICKS_POR_PULSO);
    const nota = Math.max(0, Math.min(127, e.midi));
    lista.push([ini, 1, [0x90, nota, 80]]);
    lista.push([fim, 0, [0x80, nota, 0]]);
  }
  lista.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const nome = Array.from(new TextEncoder().encode(opcoes.titulo));
  const trilha: number[] = [
    0x00,
    0xff,
    0x03,
    ...vlq(nome.length),
    ...nome,
    0x00,
    0xff,
    0x51,
    0x03,
    (usPorSeminima >> 16) & 0xff,
    (usPorSeminima >> 8) & 0xff,
    usPorSeminima & 0xff,
    0x00,
    0xc0,
    opcoes.programa & 0x7f,
  ];

  let ultimo = 0;
  for (const [tick, , bytes] of lista) {
    trilha.push(...vlq(tick - ultimo), ...bytes);
    ultimo = tick;
  }
  trilha.push(0x00, 0xff, 0x2f, 0x00);

  const n = trilha.length;
  return new Uint8Array([
    0x4d,
    0x54,
    0x68,
    0x64,
    0,
    0,
    0,
    6,
    0,
    0,
    0,
    1,
    (TICKS_POR_SEMINIMA >> 8) & 0xff,
    TICKS_POR_SEMINIMA & 0xff,
    0x4d,
    0x54,
    0x72,
    0x6b,
    (n >> 24) & 0xff,
    (n >> 16) & 0xff,
    (n >> 8) & 0xff,
    n & 0xff,
    ...trilha,
  ]);
}

/* ---------- tocador ---------- */

export type Timbre = "coro" | "orgao" | "piano";

export const TIMBRES: Record<
  Timbre,
  { rotulo: string; soundfont: string; programa: number; ganho: number }
> = {
  coro: { rotulo: "Coro", soundfont: "choir_aahs", programa: 52, ganho: 2.2 },
  orgao: { rotulo: "Órgão", soundfont: "church_organ", programa: 19, ganho: 1.4 },
  piano: { rotulo: "Piano", soundfont: "acoustic_grand_piano", programa: 0, ganho: 1.6 },
};

export class Tocador {
  tocando = false;
  instrumento: SoundfontPlayer | null = null;
  aoMudarNota: (indice: number) => void = () => {};
  aoTerminar: () => void = () => {};

  private ac: AudioContext | null = null;
  private instrumentos = new Map<Timbre, Promise<SoundfontPlayer | null>>();
  private eventos: EventoNota[] = [];
  private inicioAudio = 0;
  private fimAudio = 0;
  private segPorPulso = 0.3;
  private deslocamento = 0;
  private indiceInicial = 0;
  private osciladores: OscillatorNode[] = [];
  private raf = 0;

  private contexto(): AudioContext {
    if (!this.ac) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) throw new Error("Este navegador não tem Web Audio.");
      this.ac = new AC();
    }
    if (this.ac.state === "suspended") void this.ac.resume();
    return this.ac;
  }

  jaCarregado(timbre: Timbre): boolean {
    return this.instrumentos.has(timbre);
  }

  carregar(timbre: Timbre): Promise<SoundfontPlayer | null> {
    const existente = this.instrumentos.get(timbre);
    if (existente) return existente;
    const ac = this.contexto();
    const info = TIMBRES[timbre];
    const promessa = carregarScript(URL_SOUNDFONT)
      .then(() => {
        if (!window.Soundfont) return null;
        return window.Soundfont.instrument(ac, info.soundfont, {
          soundfont: "FluidR3_GM",
          format: "mp3",
          gain: info.ganho,
        });
      })
      .catch(() => null)
      .then((inst) => {
        if (!inst) this.instrumentos.delete(timbre);
        return inst;
      });
    this.instrumentos.set(timbre, promessa);
    return promessa;
  }

  // Síntese simples usada quando o soundfont não carrega (sem internet, por exemplo).
  private sintetizar(midi: number, quando: number, duracao: number) {
    const ac = this.contexto();
    const osc = ac.createOscillator();
    const ganho = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    ganho.gain.setValueAtTime(0, quando);
    ganho.gain.linearRampToValueAtTime(0.22, quando + 0.04);
    ganho.gain.setValueAtTime(0.22, quando + Math.max(0.05, duracao - 0.06));
    ganho.gain.linearRampToValueAtTime(0, quando + duracao);
    osc.connect(ganho).connect(ac.destination);
    osc.start(quando);
    osc.stop(quando + duracao + 0.02);
    this.osciladores.push(osc);
  }

  async tocar(eventos: EventoNota[], opcoes: { bpm: number; timbre: Timbre; aPartirDe: number }) {
    this.parar(true);
    this.eventos = eventos;
    this.segPorPulso = 60 / opcoes.bpm;
    const primeiro = eventos[opcoes.aPartirDe];
    const ultimo = eventos[eventos.length - 1];
    if (!primeiro || !ultimo) return;

    const inst = await this.carregar(opcoes.timbre);
    const ac = this.contexto();
    this.instrumento = inst;
    this.deslocamento = primeiro.inicio;
    this.inicioAudio = ac.currentTime + 0.12;
    this.indiceInicial = opcoes.aPartirDe;
    this.tocando = true;

    for (let i = opcoes.aPartirDe; i < eventos.length; i++) {
      const e = eventos[i]!;
      const quando = this.inicioAudio + (e.inicio - this.deslocamento) * this.segPorPulso;
      // um pouco de sobreposição deixa o legato mais natural
      const dur = e.duracao * this.segPorPulso * 1.04;
      if (inst) inst.play(e.midi, quando, { duration: dur });
      else this.sintetizar(e.midi, quando, dur);
    }

    this.fimAudio =
      this.inicioAudio + (ultimo.inicio + ultimo.duracao - this.deslocamento) * this.segPorPulso;
    this.acompanhar();
  }

  private acompanhar() {
    let atual = -1;
    const passo = () => {
      if (!this.tocando || !this.ac) return;
      const agora = this.ac.currentTime;
      if (agora >= this.fimAudio) {
        this.parar();
        return;
      }
      const pulso = (agora - this.inicioAudio) / this.segPorPulso + this.deslocamento;
      for (let i = Math.max(this.indiceInicial, atual); i < this.eventos.length; i++) {
        const e = this.eventos[i]!;
        if (pulso < e.inicio) break;
        if (pulso < e.inicio + e.duracao) {
          if (i !== atual) {
            atual = i;
            this.aoMudarNota(i);
          }
          break;
        }
      }
      this.raf = requestAnimationFrame(passo);
    };
    this.raf = requestAnimationFrame(passo);
  }

  parar(silencioso = false) {
    const estavaTocando = this.tocando;
    this.tocando = false;
    cancelAnimationFrame(this.raf);
    this.instrumento?.stop();
    for (const o of this.osciladores) {
      try {
        o.stop();
      } catch {
        /* já parou */
      }
    }
    this.osciladores = [];
    if (estavaTocando && !silencioso) this.aoTerminar();
  }

  fechar() {
    this.parar(true);
    void this.ac?.close();
    this.ac = null;
    this.instrumentos.clear();
  }
}
