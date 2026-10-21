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

// Respiração (em pulsos) depois de cada divisão, e quanto as duas últimas
// notas antes dela se alongam (ritardando de fim de frase).
function divisao(ex: ExsurgeLib, n: object): { pausa: number; ritardando: number } {
  if (n instanceof ex.DoubleBar) return { pausa: 3, ritardando: 1.3 };
  if (n instanceof ex.FullBar) return { pausa: 2.5, ritardando: 1.3 };
  if (n instanceof ex.HalfBar) return { pausa: 1.5, ritardando: 1.15 };
  if (n instanceof ex.QuarterBar) return { pausa: 0.75, ritardando: 1 };
  if (n instanceof ex.Virgula) return { pausa: 0.5, ritardando: 1 };
  return { pausa: 0, ritardando: 1 };
}

/*
 * Cada nota vale 1 pulso; o ponto (mora) dobra a nota e o episema
 * horizontal alonga em 50%. As notas sem ponto que fecham uma frase
 * se alongam um pouco antes da respiração.
 */
export function extrairEventos(
  ex: ExsurgeLib,
  score: ExsurgeScore,
  transposicao: number,
): EventoNota[] {
  const eventos: EventoNota[] = [];
  let t = 0;
  let aposDivisao = 0;

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
      const { pausa, ritardando } = divisao(ex, n);
      // só as duas últimas notas desde a divisão anterior
      let extra = 0;
      for (const e of eventos.slice(Math.max(eventos.length - 2, aposDivisao))) {
        e.inicio += extra;
        if (e.duracao === 1 && ritardando > 1) {
          extra += ritardando - 1;
          e.duracao = ritardando;
        }
      }
      t += extra + pausa;
      aposDivisao = eventos.length;
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

/* ---------- instrumentos ---------- */

// O que o tocador precisa de cada timbre: agendar uma nota e silenciar tudo.
interface Instrumento {
  tocarNota(midi: number, quando: number, duracao: number): void;
  parar(): void;
}

class InstrumentoSoundfont implements Instrumento {
  constructor(private player: SoundfontPlayer) {}
  tocarNota(midi: number, quando: number, duracao: number) {
    this.player.play(midi, quando, { duration: duracao });
  }
  parar() {
    this.player.stop();
  }
}

/*
 * Órgão de tubos amostrado: Bureå Gravkapell (Lars Palo, CC BY-SA 2.5).
 * Cada tecla tem um arquivo de sustentação (ataque + loop) e um de release
 * (a cauda da sala), gerados a partir do sampleset original. Só as notas
 * usadas pelo canto são baixadas.
 */
const ORGAO_PRIMEIRA = 40;
const ORGAO_ULTIMA = 82;
const ORGAO_SEG_SUSTENTACAO = 4.5;
const CROSSFADE = 0.05;

function teclaDoOrgao(midi: number) {
  let t = midi;
  while (t < ORGAO_PRIMEIRA) t += 12;
  while (t > ORGAO_ULTIMA) t -= 12;
  return t;
}

class OrgaoAmostrado implements Instrumento {
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  // buffers já decodificados, para agendar as notas sem esperar
  private cache = new Map<string, AudioBuffer>();
  private ativos = new Set<AudioBufferSourceNode>();
  private saida: GainNode;

  constructor(
    private ac: AudioContext,
    private pasta: string,
    destino: AudioNode,
  ) {
    // as amostras ficam em torno de -10 dB; o limitador segura a soma das notas no legato
    this.saida = ac.createGain();
    this.saida.gain.value = 1.8;
    const limitador = ac.createDynamicsCompressor();
    limitador.threshold.value = -6;
    limitador.knee.value = 3;
    limitador.ratio.value = 12;
    limitador.attack.value = 0.003;
    limitador.release.value = 0.15;
    this.saida.connect(limitador).connect(destino);
  }

  private buffer(nome: string): Promise<AudioBuffer | null> {
    let b = this.buffers.get(nome);
    if (!b) {
      b = fetch(`/orgao/${this.pasta}/${nome}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
        .then((dados) => this.ac.decodeAudioData(dados))
        .catch(() => {
          this.buffers.delete(nome);
          return null;
        });
      this.buffers.set(nome, b);
    }
    return b;
  }

  // Baixa as notas que faltam; devolve false se alguma não carregou.
  async carregarNotas(midis: Iterable<number>): Promise<boolean> {
    const nomes = new Set<string>();
    for (const m of midis) {
      const t = teclaDoOrgao(m);
      nomes.add(`${t}-s`);
      nomes.add(`${t}-r`);
    }
    const resultados = await Promise.all(
      [...nomes].map(async (nome) => {
        const b = await this.buffer(nome);
        if (b) this.cache.set(nome, b);
        return b;
      }),
    );
    return resultados.every(Boolean);
  }

  tocarNota(midi: number, quando: number, duracao: number) {
    const tecla = teclaDoOrgao(midi);
    const sus = this.cache.get(`${tecla}-s`);
    const rel = this.cache.get(`${tecla}-r`);
    if (!sus) return;
    const fim = quando + duracao;

    const fonte = this.ac.createBufferSource();
    fonte.buffer = sus;
    if (duracao > ORGAO_SEG_SUSTENTACAO - 0.3) {
      // notas muito longas: repete o trecho final, que já é sustentação estável
      fonte.loop = true;
      fonte.loopStart = ORGAO_SEG_SUSTENTACAO - 1.5;
      fonte.loopEnd = ORGAO_SEG_SUSTENTACAO - 0.1;
    }
    const g = this.ac.createGain();
    g.gain.setValueAtTime(1, fim);
    g.gain.linearRampToValueAtTime(0, fim + CROSSFADE);
    fonte.connect(g).connect(this.saida);
    fonte.start(quando);
    fonte.stop(fim + CROSSFADE + 0.02);
    this.registrar(fonte);

    if (rel) {
      const cauda = this.ac.createBufferSource();
      cauda.buffer = rel;
      const gr = this.ac.createGain();
      gr.gain.setValueAtTime(0, fim);
      gr.gain.linearRampToValueAtTime(1, fim + CROSSFADE);
      cauda.connect(gr).connect(this.saida);
      cauda.start(fim);
      this.registrar(cauda);
    }
  }

  private registrar(fonte: AudioBufferSourceNode) {
    this.ativos.add(fonte);
    fonte.onended = () => this.ativos.delete(fonte);
  }

  parar() {
    for (const f of this.ativos) {
      try {
        f.stop();
      } catch {
        /* já parou */
      }
    }
    this.ativos.clear();
  }
}

// Reverberação leve de igreja, gerada (ruído com decaimento exponencial).
function criarReverb(ac: AudioContext): AudioNode {
  const seg = 2.6;
  const n = Math.round(ac.sampleRate * seg);
  const ir = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
  }
  const conv = ac.createConvolver();
  conv.buffer = ir;
  const molhado = ac.createGain();
  molhado.gain.value = 0.22;
  conv.connect(molhado).connect(ac.destination);
  const entrada = ac.createGain();
  entrada.connect(ac.destination); // som direto
  entrada.connect(conv);
  return entrada;
}

/* ---------- tocador ---------- */

export type Timbre = "coro" | "orgao" | "orgaoPleno" | "piano";

type Fonte = { tipo: "soundfont"; nome: string; ganho: number } | { tipo: "orgao"; pasta: string };

export const TIMBRES: Record<Timbre, { rotulo: string; programa: number; fonte: Fonte }> = {
  coro: {
    rotulo: "Coro",
    programa: 52,
    fonte: { tipo: "soundfont", nome: "choir_aahs", ganho: 2.2 },
  },
  orgao: { rotulo: "Órgão", programa: 19, fonte: { tipo: "orgao", pasta: "orgao-suave" } },
  orgaoPleno: {
    rotulo: "Órgão pleno",
    programa: 19,
    fonte: { tipo: "orgao", pasta: "orgao-pleno" },
  },
  piano: {
    rotulo: "Piano",
    programa: 0,
    fonte: { tipo: "soundfont", nome: "acoustic_grand_piano", ganho: 1.6 },
  },
};

export class Tocador {
  tocando = false;
  instrumento: Instrumento | null = null;
  aoMudarNota: (indice: number) => void = () => {};
  aoTerminar: () => void = () => {};

  private ac: AudioContext | null = null;
  private reverb: AudioNode | null = null;
  private instrumentos = new Map<Timbre, Promise<Instrumento | null>>();
  private eventos: EventoNota[] = [];
  private inicioAudio = 0;
  private fimAudio = 0;
  private segPorPulso = 0.6;
  private deslocamento = 0;
  private indiceInicial = 0;
  private osciladores: OscillatorNode[] = [];
  private raf = 0;
  private geracao = 0;

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

  carregar(timbre: Timbre): Promise<Instrumento | null> {
    const existente = this.instrumentos.get(timbre);
    if (existente) return existente;
    const ac = this.contexto();
    const fonte = TIMBRES[timbre].fonte;
    let promessa: Promise<Instrumento | null>;
    if (fonte.tipo === "orgao") {
      this.reverb ??= criarReverb(ac);
      promessa = Promise.resolve(new OrgaoAmostrado(ac, fonte.pasta, this.reverb));
    } else {
      promessa = carregarScript(URL_SOUNDFONT)
        .then(() =>
          window.Soundfont
            ? window.Soundfont.instrument(ac, fonte.nome, {
                soundfont: "MusyngKite",
                format: "mp3",
                gain: fonte.ganho,
              })
            : null,
        )
        .then((p) => (p ? new InstrumentoSoundfont(p) : null))
        .catch(() => null)
        .then((inst) => {
          if (!inst) this.instrumentos.delete(timbre);
          return inst;
        });
    }
    this.instrumentos.set(timbre, promessa);
    return promessa;
  }

  // Síntese simples usada quando o timbre não carrega (sem internet, por exemplo).
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

  // Devolve true se começou a tocar (false se foi interrompido enquanto carregava).
  async tocar(
    eventos: EventoNota[],
    opcoes: { bpm: number; timbre: Timbre; aPartirDe: number },
  ): Promise<boolean> {
    this.parar(true);
    const geracao = ++this.geracao;
    this.eventos = eventos;
    this.segPorPulso = 60 / opcoes.bpm;
    const primeiro = eventos[opcoes.aPartirDe];
    const ultimo = eventos[eventos.length - 1];
    if (!primeiro || !ultimo) return false;

    let inst = await this.carregar(opcoes.timbre);
    if (inst instanceof OrgaoAmostrado) {
      const ok = await inst.carregarNotas(eventos.slice(opcoes.aPartirDe).map((e) => e.midi));
      if (!ok) inst = null;
    }
    // outro "tocar" ou "parar" aconteceu enquanto carregava
    if (geracao !== this.geracao) return false;

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
      if (inst) inst.tocarNota(e.midi, quando, dur);
      else this.sintetizar(e.midi, quando, dur);
    }

    this.fimAudio =
      this.inicioAudio + (ultimo.inicio + ultimo.duracao - this.deslocamento) * this.segPorPulso;
    this.acompanhar();
    return true;
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
    this.geracao++;
    cancelAnimationFrame(this.raf);
    this.instrumento?.parar();
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
    this.reverb = null;
    this.instrumentos.clear();
  }
}
