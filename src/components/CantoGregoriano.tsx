import { useCallback, useEffect, useRef, useState } from "react";
import {
  carregarScript,
  extrairEventos,
  gerarMidi,
  TIMBRES,
  Tocador,
  URL_EXSURGE,
  type EventoNota,
  type ExsurgeContext,
  type ExsurgeLib,
  type ExsurgeScore,
  type Timbre,
} from "@/lib/canto-midi";
import { EXEMPLOS_GABC } from "@/lib/exemplos-gabc";

const COR_TINTA = "#1a2233";
const COR_RUBRICA = "#a33a2c";
const SVG_NS = "http://www.w3.org/2000/svg";

interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Aceita GABC com cabeçalho (name: ...; %%) ou só o corpo.
function corpoGabc(texto: string) {
  const i = texto.indexOf("%%");
  return i >= 0 ? texto.slice(i + 2) : texto;
}

function nomeArquivo(titulo: string, ext: string) {
  const base = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "canto-gregoriano"}.${ext}`;
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const primeiroExemplo = EXEMPLOS_GABC[0]!;

export function CantoGregoriano() {
  const [gabc, setGabc] = useState(primeiroExemplo.gabc);
  const [exemploId, setExemploId] = useState(primeiroExemplo.id);
  const [titulo, setTitulo] = useState(primeiroExemplo.titulo);
  const [subtitulo, setSubtitulo] = useState(primeiroExemplo.subtitulo);
  const [anotacao, setAnotacao] = useState(primeiroExemplo.anotacao);
  const [timbre, setTimbre] = useState<Timbre>("coro");
  const [bpm, setBpm] = useState(190);
  const [transposicao, setTransposicao] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [temNotas, setTemNotas] = useState(false);

  const partituraRef = useRef<HTMLDivElement>(null);
  const exRef = useRef<ExsurgeLib | null>(null);
  const ctxtRef = useRef<ExsurgeContext | null>(null);
  const scoreRef = useRef<ExsurgeScore | null>(null);
  const eventosRef = useRef<EventoNota[]>([]);
  const posicoesRef = useRef<(Retangulo | null)[]>([]);
  const tocadorRef = useRef<Tocador | null>(null);
  const transposicaoRef = useRef(transposicao);
  transposicaoRef.current = transposicao;

  if (!tocadorRef.current && typeof window !== "undefined") tocadorRef.current = new Tocador();

  /* ---------- destaque da nota que está tocando ---------- */

  const destacar = useCallback((indice: number) => {
    const r = partituraRef.current?.querySelector(".nota-ativa");
    const p = posicoesRef.current[indice];
    if (!r) return;
    if (!p) {
      r.classList.remove("visivel");
      return;
    }
    r.setAttribute("x", String(p.x));
    r.setAttribute("y", String(p.y));
    r.setAttribute("width", String(p.w));
    r.setAttribute("height", String(p.h));
    r.classList.add("visivel");
  }, []);

  const limparDestaque = useCallback(() => {
    partituraRef.current?.querySelector(".nota-ativa")?.classList.remove("visivel");
  }, []);

  /* ---------- partitura ---------- */

  const recalcularEventos = useCallback(() => {
    const ex = exRef.current;
    const score = scoreRef.current;
    eventosRef.current = ex && score ? extrairEventos(ex, score, transposicaoRef.current) : [];
    setTemNotas(eventosRef.current.length > 0);
  }, []);

  // Calcula onde cada nota está no SVG e cria uma camada de destaque
  // (atrás das notas) e uma camada clicável (na frente).
  const prepararDestaques = useCallback(() => {
    const div = partituraRef.current;
    const score = scoreRef.current;
    const ctxt = ctxtRef.current;
    const svg = div?.querySelector("svg");
    const raiz = svg?.querySelector("g");
    if (!svg || !raiz || !score || !ctxt) return;

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("viewBox", `0 0 ${score.bounds.width} ${score.bounds.height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Partitura em notação gregoriana");

    const linhaDaNotacao = new Map<number, ExsurgeScore["lines"][number]>();
    for (const linha of score.lines)
      for (let i = 0; i < linha.numNotationsOnLine; i++)
        linhaDaNotacao.set(linha.notationsStartIndex + i, linha);

    const fundo = document.createElementNS(SVG_NS, "g");
    const cliques = document.createElementNS(SVG_NS, "g");
    const folga = ctxt.staffInterval * 0.6;

    posicoesRef.current = eventosRef.current.map((e, i) => {
      const linha = linhaDaNotacao.get(e.indiceNotacao);
      if (!linha) return null;
      const b = e.nota.bounds;
      const ret = {
        x: linha.bounds.x + e.notacao.bounds.x + b.x - folga,
        y: linha.bounds.y + b.y - folga,
        w: b.width + folga * 2,
        h: b.height + folga * 2,
      };
      const alvo = document.createElementNS(SVG_NS, "rect");
      alvo.setAttribute("x", String(ret.x));
      alvo.setAttribute("y", String(ret.y));
      alvo.setAttribute("width", String(ret.w));
      alvo.setAttribute("height", String(ret.h));
      alvo.setAttribute("class", "alvo-nota");
      alvo.setAttribute("data-indice", String(i));
      const dica = document.createElementNS(SVG_NS, "title");
      dica.textContent = "Tocar a partir daqui";
      alvo.appendChild(dica);
      cliques.appendChild(alvo);
      return ret;
    });

    const destaque = document.createElementNS(SVG_NS, "rect");
    destaque.setAttribute("class", "nota-ativa");
    destaque.setAttribute("rx", String(ctxt.staffInterval * 0.4));
    fundo.appendChild(destaque);

    raiz.insertBefore(fundo, raiz.firstChild);
    raiz.appendChild(cliques);
  }, []);

  const diagramar = useCallback(() => {
    const score = scoreRef.current;
    const ctxt = ctxtRef.current;
    const div = partituraRef.current;
    if (!score || !ctxt || !div) return;
    const largura = div.clientWidth;
    score.performLayoutAsync(ctxt, () => {
      score.layoutChantLines(ctxt, largura, () => {
        div.innerHTML = score.createSvg(ctxt);
        recalcularEventos();
        prepararDestaques();
      });
    });
  }, [prepararDestaques, recalcularEventos]);

  const montarPartitura = useCallback(
    (fonte: string, anot: string) => {
      const ex = exRef.current;
      const ctxt = ctxtRef.current;
      if (!ex || !ctxt) return;
      tocadorRef.current?.parar(true);
      setTocando(false);
      setErro(false);
      try {
        const mapeamentos = ex.Gabc.createMappingsFromSource(ctxt, corpoGabc(fonte));
        const score = new ex.ChantScore(ctxt, mapeamentos, true);
        if (anot) score.annotation = new ex.Annotation(ctxt, anot);
        scoreRef.current = score;
      } catch {
        scoreRef.current = null;
        eventosRef.current = [];
        setTemNotas(false);
        setErro(true);
        if (partituraRef.current) partituraRef.current.innerHTML = "";
        return;
      }
      diagramar();
    },
    [diagramar],
  );

  /* ---------- carregamento ---------- */

  useEffect(() => {
    let ativo = true;
    // As letras são medidas na hora de diagramar, então a fonte precisa estar pronta.
    const fontes = Promise.all([
      document.fonts.load("22px 'Cormorant Garamond'"),
      document.fonts.load("72px 'Cormorant Garamond'"),
      document.fonts.load("12px 'Manrope'"),
    ]).catch(() => undefined);

    Promise.all([fontes, carregarScript(URL_EXSURGE)])
      .then(() => {
        const ex = window.exsurge;
        if (!ativo || !ex) return;
        const ctxt = new ex.ChantContext();
        ctxt.lyricTextFont = "'Cormorant Garamond', Georgia, serif";
        ctxt.lyricTextSize = 22;
        ctxt.lyricTextColor = COR_TINTA;
        ctxt.dropCapTextFont = ctxt.lyricTextFont;
        ctxt.dropCapTextSize = 72;
        ctxt.dropCapTextColor = COR_RUBRICA;
        ctxt.annotationTextFont = "'Manrope', system-ui, sans-serif";
        ctxt.annotationTextSize = 12;
        ctxt.annotationTextColor = COR_RUBRICA;
        ctxt.neumeLineColor = COR_TINTA;
        ctxt.staffLineColor = COR_RUBRICA;
        ctxt.dividerLineColor = COR_TINTA;
        exRef.current = ex;
        ctxtRef.current = ctxt;
        setPronto(true);
      })
      .catch(() => {
        if (ativo)
          setStatus("Não foi possível carregar o desenho da partitura. Recarregue a página.");
      });

    return () => {
      ativo = false;
      tocadorRef.current?.fechar();
    };
  }, []);

  useEffect(() => {
    const tocador = tocadorRef.current;
    if (!tocador) return;
    tocador.aoMudarNota = destacar;
    tocador.aoTerminar = () => {
      setTocando(false);
      limparDestaque();
    };
  }, [destacar, limparDestaque]);

  // Redesenha quando o código muda (com uma pequena espera enquanto se digita).
  useEffect(() => {
    if (!pronto) return;
    const t = setTimeout(() => montarPartitura(gabc, anotacao), 300);
    return () => clearTimeout(t);
  }, [pronto, gabc, anotacao, montarPartitura]);

  // Rediagrama quando a largura muda.
  useEffect(() => {
    const div = partituraRef.current;
    if (!pronto || !div) return;
    let largura = div.clientWidth;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const obs = new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (div.clientWidth === largura) return;
        largura = div.clientWidth;
        tocadorRef.current?.parar();
        diagramar();
      }, 200);
    });
    obs.observe(div);
    return () => {
      obs.disconnect();
      clearTimeout(espera);
    };
  }, [pronto, diagramar]);

  useEffect(() => {
    tocadorRef.current?.parar();
    recalcularEventos();
  }, [transposicao, recalcularEventos]);

  /* ---------- ações ---------- */

  const tocar = (aPartirDe: number) => {
    const tocador = tocadorRef.current;
    if (!tocador || !eventosRef.current.length) return;
    if (!tocador.jaCarregado(timbre)) setStatus("Carregando o timbre…");
    setTocando(true);
    void tocador.tocar(eventosRef.current, { bpm, timbre, aPartirDe }).then(() => {
      setStatus(tocador.instrumento ? "" : "Sem conexão com os timbres: usando som sintetizado.");
    });
  };

  const alternar = () => {
    if (tocadorRef.current?.tocando) tocadorRef.current.parar();
    else tocar(0);
  };

  const escolherExemplo = (id: string) => {
    setExemploId(id);
    const ex = EXEMPLOS_GABC.find((e) => e.id === id);
    if (!ex) return;
    setGabc(ex.gabc);
    setTitulo(ex.titulo);
    setSubtitulo(ex.subtitulo);
    setAnotacao(ex.anotacao);
  };

  const editar = (texto: string) => {
    setGabc(texto);
    if (exemploId) {
      setExemploId("");
      setTitulo("Seu canto");
      setSubtitulo("Partitura gerada a partir do seu código GABC");
      setAnotacao("");
    }
  };

  const baixarMidi = () => {
    const dados = gerarMidi(eventosRef.current, {
      bpm,
      programa: TIMBRES[timbre].programa,
      titulo,
    });
    baixar(new Blob([dados as BlobPart], { type: "audio/midi" }), nomeArquivo(titulo, "mid"));
  };

  const baixarSvg = () => {
    const score = scoreRef.current;
    const ctxt = ctxtRef.current;
    if (!score || !ctxt) return;
    baixar(
      new Blob([score.createSvg(ctxt)], { type: "image/svg+xml" }),
      nomeArquivo(titulo, "svg"),
    );
  };

  const cliqueNaPartitura = (ev: React.MouseEvent<HTMLDivElement>) => {
    const alvo = (ev.target as Element).closest?.(".alvo-nota");
    if (alvo) tocar(Number(alvo.getAttribute("data-indice")));
  };

  /* ---------- interface ---------- */

  const rotuloCampo =
    "mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-soft";
  const select =
    "h-11 w-full cursor-pointer appearance-none rounded-full border border-ink/10 bg-white/85 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b6b86' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_14px_center] bg-no-repeat pl-4 pr-10 text-sm font-medium text-ink";
  const botaoSecundario =
    "h-11 flex-1 rounded-full border border-ink/10 bg-white/85 px-5 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none";

  return (
    <div className="space-y-6">
      <section
        className="glass-strong rounded-[2rem] p-5 shadow-xl md:p-8"
        aria-labelledby="titulo-canto"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#a33a2c]">
              {subtitulo}
            </p>
            <h2 id="titulo-canto" className="font-serif text-3xl text-ink md:text-4xl">
              {titulo}
            </h2>
          </div>
          <label className="w-full sm:w-auto">
            <span className={rotuloCampo}>Exemplo</span>
            <select
              className={select}
              value={exemploId}
              onChange={(e) => escolherExemplo(e.target.value)}
            >
              <option value="">Seu canto</option>
              {EXEMPLOS_GABC.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.titulo}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          role="toolbar"
          aria-label="Controles de reprodução"
          className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm md:sticky md:top-4 md:z-10 md:backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={alternar}
            disabled={!temNotas}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-[124px]"
          >
            {tocando ? (
              <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
                <rect x="7" y="6" width="10" height="12" rx="1.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            )}
            {tocando ? "Parar" : "Ouvir"}
          </button>

          <div
            role="radiogroup"
            aria-label="Timbre"
            className="flex h-11 flex-1 rounded-full bg-ink/[0.06] p-1 sm:flex-none"
          >
            {(Object.keys(TIMBRES) as Timbre[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={timbre === t}
                onClick={() => {
                  tocadorRef.current?.parar();
                  setTimbre(t);
                  void tocadorRef.current?.carregar(t); // já deixa o timbre carregando
                }}
                className={`flex-1 rounded-full px-4 text-sm font-semibold transition ${
                  timbre === t ? "bg-white text-ink shadow-sm" : "text-soft hover:text-ink"
                }`}
              >
                {TIMBRES[t].rotulo}
              </button>
            ))}
          </div>

          <label className="min-w-[170px] flex-1 sm:max-w-[240px]">
            <span className={rotuloCampo}>
              Andamento <output className="ml-1 tabular-nums text-ink">{bpm}</output>
            </span>
            <input
              type="range"
              min={100}
              max={300}
              step={5}
              value={bpm}
              onChange={(e) => {
                tocadorRef.current?.parar();
                setBpm(Number(e.target.value));
              }}
              className="h-11 w-full cursor-pointer accent-[#1a2233]"
            />
          </label>

          <label className="w-full sm:w-auto">
            <span className={rotuloCampo}>Tom</span>
            <select
              className={select}
              value={transposicao}
              onChange={(e) => setTransposicao(Number(e.target.value))}
            >
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0
                    ? "Original"
                    : `${n > 0 ? "+" : "−"}${Math.abs(n)} semitom${Math.abs(n) > 1 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </label>

          <div className="flex w-full gap-2 lg:ml-auto lg:w-auto">
            <button
              type="button"
              className={botaoSecundario}
              onClick={baixarMidi}
              disabled={!temNotas}
            >
              Baixar MIDI
            </button>
            <button
              type="button"
              className={botaoSecundario}
              onClick={baixarSvg}
              disabled={!temNotas}
            >
              Baixar SVG
            </button>
          </div>
        </div>

        <p
          role="status"
          aria-live="polite"
          className="mx-1 mb-2 mt-3 min-h-[1.4em] text-sm text-soft"
        >
          {status}
        </p>

        <div className="rounded-2xl border border-ink/[0.07] bg-[#fffdf8] px-3 py-4 shadow-sm sm:px-8 sm:py-8">
          {/* o exsurge escreve o SVG aqui dentro */}
          <div
            ref={partituraRef}
            onClick={cliqueNaPartitura}
            className="canto-partitura min-h-40 w-full"
          />
          {!pronto && !status && <p className="text-sm text-soft">Preparando a partitura…</p>}
          {erro && (
            <p className="rounded-xl bg-[#a33a2c]/[0.08] px-4 py-3 text-sm text-[#a33a2c]">
              Não consegui ler esse código GABC. Confira se cada sílaba tem as notas entre
              parênteses, como{" "}
              <code className="rounded bg-ink/[0.06] px-1.5 font-mono">Ky(f)ri(gh)e(h)</code>.
            </p>
          )}
        </div>
      </section>

      <section
        className="glass-strong rounded-[2rem] p-5 shadow-xl md:p-8"
        aria-labelledby="titulo-editor"
      >
        <h2 id="titulo-editor" className="font-serif text-2xl text-ink md:text-3xl">
          Código GABC
        </h2>
        <p className="mb-4 mt-1 text-soft">
          A partitura se atualiza enquanto você digita. Pode colar o arquivo .gabc inteiro, com
          cabeçalho.
        </p>
        <textarea
          value={gabc}
          onChange={(e) => editar(e.target.value)}
          spellCheck={false}
          rows={9}
          aria-label="Código GABC"
          className="block min-h-[180px] w-full resize-y rounded-2xl border border-ink/10 bg-white/90 px-4 py-4 font-mono text-sm leading-relaxed text-ink"
        />
        <details className="mt-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">
            Guia rápido de GABC
          </summary>
          <dl className="mt-2 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["(c4) (c3) (f3)", "Clave de Dó ou de Fá e a linha em que ela fica."],
              ["Ky(f)", "Sílaba e nota. As letras de a a m vão do grave ao agudo."],
              ["(fgh)", "Várias notas formam um neuma na mesma sílaba."],
              ["(f.)", "Ponto de mora: a nota dura o dobro."],
              ["(f_)", "Episema horizontal: a nota é alongada."],
              ["(ix) (iy)", "Bemol e bequadro na altura indicada (aqui, i)."],
              ["(,) (;) (:) (::)", "Barras de divisão: quarto, meia, inteira e dupla."],
            ].map(([codigo, texto]) => (
              <div key={codigo} className="border-t border-ink/10 py-3">
                <dt className="mb-1 font-mono text-sm text-ink">{codigo}</dt>
                <dd className="text-sm text-soft">{texto}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>
    </div>
  );
}
