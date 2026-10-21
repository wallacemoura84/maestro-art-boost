import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BibliotecaKyriale } from "@/components/BibliotecaKyriale";
import { GuiaGabc } from "@/components/GuiaGabc";
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
import {
  configurarContexto,
  corpoGabc,
  lerCabecalho,
  modoRomano,
  nomeDaParte,
  prepararParaExsurge,
  romano,
} from "@/lib/gabc";
import { MISSAS, partesDaMissa, pecaDaMissa, todasAsPecas, type PecaKyriale } from "@/lib/kyriale";

const SVG_NS = "http://www.w3.org/2000/svg";
const PARTITURA = "partitura"; // id do que está tocando quando é a partitura principal

interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
}

// De onde veio a partitura (exemplo ou Kyriale). Some quando o código é editado.
interface Origem {
  id: string;
  titulo: string;
  subtitulo: string;
  anotacao?: string;
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
const PECAS_KYRIALE = todasAsPecas();

export function CantoGregoriano() {
  const [gabc, setGabc] = useState(primeiroExemplo.gabc);
  const [origem, setOrigem] = useState<Origem | null>({
    id: primeiroExemplo.id,
    titulo: primeiroExemplo.titulo,
    subtitulo: primeiroExemplo.subtitulo,
    anotacao: primeiroExemplo.anotacao,
  });
  const [carregandoPeca, setCarregandoPeca] = useState<string | null>(null);
  const [timbre, setTimbre] = useState<Timbre>("orgao");
  // 0,6 s por nota: o Christus factus est fica em ~2min35s, perto das gravações de Solesmes
  const [bpm, setBpm] = useState(100);
  const [transposicao, setTransposicao] = useState(0);
  const [tocandoId, setTocandoId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState(false);
  const [ex, setEx] = useState<ExsurgeLib | null>(null);
  const [temNotas, setTemNotas] = useState(false);

  const partituraRef = useRef<HTMLDivElement>(null);
  const cartaoPartituraRef = useRef<HTMLElement>(null);
  const ctxtRef = useRef<ExsurgeContext | null>(null);
  const scoreRef = useRef<ExsurgeScore | null>(null);
  const eventosRef = useRef<EventoNota[]>([]);
  const posicoesRef = useRef<(Retangulo | null)[]>([]);
  const tocadorRef = useRef<Tocador | null>(null);
  const pedidoRef = useRef(0); // ignora respostas de cliques antigos em "Ouvir"
  const transposicaoRef = useRef(transposicao);
  transposicaoRef.current = transposicao;

  if (!tocadorRef.current && typeof window !== "undefined") tocadorRef.current = new Tocador();

  // Título, subtítulo e anotação: da origem (exemplo/Kyriale) ou do cabeçalho do GABC.
  const cabecalho = useMemo(() => lerCabecalho(gabc), [gabc]);
  const titulo = origem?.titulo ?? cabecalho.nome ?? "Seu canto";
  const subtitulo =
    origem?.subtitulo ??
    ([
      cabecalho.parte && nomeDaParte(cabecalho.parte),
      cabecalho.modo && `Modo ${modoRomano(cabecalho.modo)}`,
    ]
      .filter(Boolean)
      .join(" · ") ||
      "Partitura do seu código GABC");
  const anotacao =
    origem?.anotacao ?? cabecalho.anotacao ?? (cabecalho.modo ? modoRomano(cabecalho.modo) : "");

  const tocando = tocandoId === PARTITURA;

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
    const score = scoreRef.current;
    eventosRef.current = ex && score ? extrairEventos(ex, score, transposicaoRef.current) : [];
    setTemNotas(eventosRef.current.length > 0);
  }, [ex]);

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
    // página escondida (largura zero): o ResizeObserver diagrama quando ela aparecer
    if (largura < 50) return;
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
      const ctxt = ctxtRef.current;
      if (!ex || !ctxt) return;
      tocadorRef.current?.parar(true);
      setTocandoId(null);
      setErro(false);
      try {
        const corpo = prepararParaExsurge(corpoGabc(fonte));
        const score = new ex.ChantScore(ctxt, ex.Gabc.createMappingsFromSource(ctxt, corpo), true);
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
    [ex, diagramar],
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
        const lib = window.exsurge;
        if (!ativo || !lib) return;
        const ctxt = new lib.ChantContext();
        configurarContexto(ctxt);
        ctxtRef.current = ctxt;
        setEx(lib);
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
    tocador.aoTerminar = () => {
      setTocandoId(null);
      limparDestaque();
    };
  }, [limparDestaque]);

  // Redesenha quando o código muda (com uma pequena espera enquanto se digita).
  useEffect(() => {
    if (!ex) return;
    const t = setTimeout(() => montarPartitura(gabc, anotacao), 300);
    return () => clearTimeout(t);
  }, [ex, gabc, anotacao, montarPartitura]);

  // Rediagrama quando a largura muda.
  useEffect(() => {
    const div = partituraRef.current;
    if (!ex || !div) return;
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
  }, [ex, diagramar]);

  useEffect(() => {
    tocadorRef.current?.parar();
    recalcularEventos();
  }, [transposicao, recalcularEventos]);

  /* ---------- reprodução ---------- */

  // Toca a partitura principal (id PARTITURA, com destaque) ou um exemplo do guia.
  const tocarEventos = (id: string, eventos: EventoNota[], aPartirDe = 0) => {
    const tocador = tocadorRef.current;
    if (!tocador || !eventos.length) return;
    const pedido = ++pedidoRef.current;
    tocador.aoMudarNota = id === PARTITURA ? destacar : () => {};
    limparDestaque();
    // o órgão baixa só as notas do canto; avisa se demorar
    const aviso = setTimeout(() => {
      if (pedido === pedidoRef.current) setStatus("Carregando o timbre…");
    }, 150);
    setTocandoId(id);
    void tocador.tocar(eventos, { bpm, timbre, aPartirDe }).then((iniciou) => {
      clearTimeout(aviso);
      if (pedido !== pedidoRef.current) return; // já houve outro clique
      if (!iniciou) setTocandoId(null);
      setStatus(
        !iniciou || tocador.instrumento
          ? ""
          : "Sem conexão com os timbres: usando som sintetizado.",
      );
    });
  };

  const parar = () => {
    pedidoRef.current++;
    tocadorRef.current?.parar();
    setTocandoId(null);
    setStatus("");
  };

  const alternar = () => {
    if (tocando) parar();
    else tocarEventos(PARTITURA, eventosRef.current);
  };

  /* ---------- escolha da partitura ---------- */

  const escolherKyriale = (peca: PecaKyriale) => {
    parar();
    setCarregandoPeca(peca.id);
    fetch(peca.arquivo)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))))
      .then((texto) => {
        setGabc(texto);
        setOrigem({ id: peca.id, titulo: peca.titulo, subtitulo: peca.subtitulo });
        cartaoPartituraRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(() => setStatus("Não foi possível carregar essa partitura. Tente de novo."))
      .finally(() => setCarregandoPeca(null));
  };

  const escolher = (id: string) => {
    if (!id) {
      // "Seu canto": mantém o código e passa a usar o cabeçalho dele
      setOrigem(null);
      return;
    }
    const exemplo = EXEMPLOS_GABC.find((e) => e.id === id);
    if (exemplo) {
      parar();
      setGabc(exemplo.gabc);
      setOrigem({
        id: exemplo.id,
        titulo: exemplo.titulo,
        subtitulo: exemplo.subtitulo,
        anotacao: exemplo.anotacao,
      });
      return;
    }
    const peca = PECAS_KYRIALE.find((p) => p.id === id);
    if (peca) escolherKyriale(peca);
  };

  const editar = (texto: string) => {
    setGabc(texto);
    setOrigem(null);
  };

  /* ---------- downloads ---------- */

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
    if (alvo) tocarEventos(PARTITURA, eventosRef.current, Number(alvo.getAttribute("data-indice")));
  };

  /* ---------- interface ---------- */

  const rotuloCampo =
    "mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-soft";
  const select =
    "h-11 w-full cursor-pointer appearance-none rounded-full border border-ink/10 bg-white/85 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b6b86' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_14px_center] bg-no-repeat pl-4 pr-10 text-sm font-medium text-ink";
  const botaoSecundario =
    "h-11 flex-1 rounded-full border border-ink/10 bg-white/85 px-5 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none";
  const cartao = "glass-strong rounded-[2rem] p-5 shadow-xl md:p-8";

  return (
    <div className="space-y-6">
      <section
        ref={cartaoPartituraRef}
        className={`${cartao} scroll-mt-4`}
        aria-labelledby="titulo-canto"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#a33a2c]">
              {subtitulo}
            </p>
            <h2 id="titulo-canto" className="font-serif text-3xl text-ink md:text-4xl">
              {titulo}
            </h2>
          </div>
          <label className="w-full sm:w-72">
            <span className={rotuloCampo}>Partitura</span>
            <select
              className={select}
              value={origem?.id ?? ""}
              onChange={(e) => escolher(e.target.value)}
            >
              <option value="">Seu canto</option>
              <optgroup label="Exemplos">
                {EXEMPLOS_GABC.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titulo}
                  </option>
                ))}
              </optgroup>
              {MISSAS.map((m) => (
                <optgroup key={m.numero} label={`Kyriale · Missa ${romano(m.numero)} · ${m.nome}`}>
                  {partesDaMissa(m).map((p) => {
                    const peca = pecaDaMissa(m, p);
                    return (
                      <option key={peca.id} value={peca.id}>
                        {peca.titulo}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
              <optgroup label="Kyriale · Credo">
                {PECAS_KYRIALE.filter((p) => p.id.startsWith("credo")).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                  </option>
                ))}
              </optgroup>
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
                  parar();
                  setTimbre(t);
                  void tocadorRef.current?.carregar(t); // já deixa o timbre carregando
                }}
                className={`flex-1 whitespace-nowrap rounded-full px-2 text-sm font-semibold transition sm:px-3 ${
                  timbre === t ? "bg-white text-ink shadow-sm" : "text-soft hover:text-ink"
                }`}
              >
                {TIMBRES[t].rotulo}
              </button>
            ))}
          </div>

          <label className="min-w-[170px] flex-1 sm:max-w-[240px]">
            <span className={rotuloCampo}>
              Andamento{" "}
              <output className="ml-1 normal-case tracking-normal tabular-nums text-ink">
                {bpm} notas/min
              </output>
            </span>
            <input
              type="range"
              min={60}
              max={200}
              step={5}
              value={bpm}
              onChange={(e) => {
                parar();
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
          {!ex && !status && <p className="text-sm text-soft">Preparando a partitura…</p>}
          {erro && (
            <p className="rounded-xl bg-[#a33a2c]/[0.08] px-4 py-3 text-sm text-[#a33a2c]">
              Não consegui ler esse código GABC. Confira se cada sílaba tem as notas entre
              parênteses, como{" "}
              <code className="rounded bg-ink/[0.06] px-1.5 font-mono">Ky(f)ri(gh)e(h)</code>.
            </p>
          )}
        </div>
      </section>

      <section className={cartao} aria-labelledby="titulo-kyriale">
        <h2 id="titulo-kyriale" className="font-serif text-2xl text-ink md:text-3xl">
          Kyriale
        </h2>
        <p className="mb-5 mt-1 text-soft">
          As 18 Missas do Ordinário e os seis Credos, prontos para ler e ouvir. Escolha uma parte e
          ela abre na partitura acima.
        </p>
        <BibliotecaKyriale
          selecionado={origem?.id ?? null}
          carregando={carregandoPeca}
          onEscolher={escolherKyriale}
        />
      </section>

      <section className={cartao} aria-labelledby="titulo-editor">
        <h2 id="titulo-editor" className="font-serif text-2xl text-ink md:text-3xl">
          Código GABC
        </h2>
        <p className="mb-4 mt-1 text-soft">
          A partitura se atualiza enquanto você digita. Pode colar um arquivo .gabc inteiro: o
          título, o tipo de peça e o modo saem do cabeçalho (name, office-part e mode).
        </p>
        <textarea
          value={gabc}
          onChange={(e) => editar(e.target.value)}
          spellCheck={false}
          rows={9}
          aria-label="Código GABC"
          className="block min-h-[180px] w-full resize-y rounded-2xl border border-ink/10 bg-white/90 px-4 py-4 font-mono text-sm leading-relaxed text-ink"
        />
      </section>

      <section className={cartao} aria-labelledby="titulo-guia">
        <h2 id="titulo-guia" className="font-serif text-2xl text-ink md:text-3xl">
          Guia visual do GABC
        </h2>
        <p className="mb-5 mt-1 text-soft">
          O GABC é um jeito de escrever canto gregoriano com letras. Cada exemplo abaixo mostra o
          código, a partitura que ele gera e o som; use o mesmo timbre e andamento escolhidos acima.
        </p>
        <GuiaGabc
          ex={ex}
          transposicao={transposicao}
          tocandoId={tocandoId}
          onOuvir={(id, eventos) => tocarEventos(id, eventos)}
          onParar={parar}
        />
      </section>
    </div>
  );
}
