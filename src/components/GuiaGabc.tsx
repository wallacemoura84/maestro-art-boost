import { useEffect, useRef } from "react";
import {
  extrairEventos,
  type EventoNota,
  type ExsurgeContext,
  type ExsurgeLib,
  type ExsurgeScore,
} from "@/lib/canto-midi";
import { configurarContexto } from "@/lib/gabc";

interface Licao {
  id: string;
  titulo: string;
  codigo: string[];
  gabc: string;
  texto: string;
}

// Na clave c4 a letra j é o Dó; daí para baixo e para cima.
const SOLFEJO_C4 = [
  ["a", "Lá"],
  ["b", "Si"],
  ["c", "Dó"],
  ["d", "Ré"],
  ["e", "Mi"],
  ["f", "Fá"],
  ["g", "Sol"],
  ["h", "Lá"],
  ["i", "Si"],
  ["j", "Dó"],
  ["k", "Ré"],
  ["l", "Mi"],
  ["m", "Fá"],
];

const ALTURAS: Licao = {
  id: "alturas",
  titulo: "As alturas: de a até m",
  codigo: ["(c4) a(a) b(b) c(c) … m(m)"],
  gabc: "(c4) " + SOLFEJO_C4.map(([l]) => `${l}(${l})`).join(" "),
  texto:
    "Cada letra é uma posição na pauta, do grave ao agudo: linhas e espaços se alternam. A clave diz onde fica o Dó. Com (c4), clave de Dó na 4ª linha, a letra j é o Dó.",
};

const LICOES: Licao[] = [
  {
    id: "silabas",
    titulo: "Sílabas e notas",
    codigo: ["Ky(f)ri(gh)e(h)"],
    gabc: "(c4) Ky(f)ri(gh)e(h) e(h)lé(ih)i(g)son.(g.) (::)",
    texto:
      "Escreva a sílaba e, colado nela, as notas entre parênteses. Sílabas da mesma palavra ficam juntas; um espaço separa as palavras.",
  },
  {
    id: "claves",
    titulo: "Claves",
    codigo: ["(c4)", "(c3)", "(f3)"],
    gabc: "(c4) Dó(j) (::) (c3) Dó(h) (::) (f3) Fá(h) (::)",
    texto:
      "c é a clave de Dó e f a de Fá; o número é a linha, contando de baixo. A clave fica no começo, entre parênteses, e pode mudar no meio do canto.",
  },
  {
    id: "neumas",
    titulo: "Neumas básicos",
    codigo: ["(fg)", "(gf)", "(fgf)", "(hgh)", "(hGF)", "(fgh)"],
    gabc: "(c4) Pódatus(fg) Clívis(gf) Tórculus(fgf) Porréctus(hgh) Clímacus(hGF) Scándicus(fgh) (::)",
    texto:
      "Várias notas na mesma sílaba formam um neuma; o desenho sai da ordem das letras. Letras maiúsculas viram notas em losango (punctum inclinatum), típicas do clímacus.",
  },
  {
    id: "duracao",
    titulo: "Ponto e episema",
    codigo: ["(g.)", "(g_)"],
    gabc: "(c4) Nor(g)mal(g) (,) pon(g.)to(g.) (,) e(g_)pi(g_)se(g_)ma(g_) (::)",
    texto:
      "O ponto de mora (g.) dobra a duração da nota. O episema horizontal (g_) a alonga um pouco. Ouça a diferença entre os três grupos.",
  },
  {
    id: "acidentes",
    titulo: "Bemol e bequadro",
    codigo: ["(ixi)", "(iyi)"],
    gabc: "(c4) Si(i) be(ixi)mol(i) (;) be(iyi)qua(i)dro(h) (::)",
    texto:
      "x antes da nota escreve um bemol; y, um bequadro. Na clave c4 a letra i é o Si, então (ixi) é Si bemol. O bemol vale até o fim da palavra.",
  },
  {
    id: "barras",
    titulo: "Barras de divisão",
    codigo: ["(,)", "(;)", "(:)", "(::)"],
    gabc: "(c4) quar(g)to(g) (,) mei(g)a(g) (;) in(g)tei(g)ra(g) (:) du(g)pla.(g) (::)",
    texto:
      "Marcam as respirações, da menor para a maior. A dupla fecha o canto ou uma seção. No áudio, cada barra vira uma pausa um pouco mais longa.",
  },
  {
    id: "sinais",
    titulo: "Outros sinais",
    codigo: ["(hv)", "(fgwh)", "(fg~)"],
    gabc: "(c4) Vir(hv)ga(g) (,) qui(fgwh)lis(g)ma(g) (,) li(f)ques(fg~)cen(g)te.(f) (::)",
    texto:
      "v desenha a nota com haste (virga). w transforma a nota em quilisma, a nota ondulada. ~ faz a nota liquescente, menor, para consoantes que soam.",
  },
];

type Props = {
  ex: ExsurgeLib | null;
  transposicao: number;
  tocandoId: string | null;
  onOuvir: (id: string, eventos: EventoNota[]) => void;
  onParar: () => void;
};

export function GuiaGabc({ ex, transposicao, tocandoId, onOuvir, onParar }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const alvos = useRef(new Map<string, HTMLDivElement>());
  const scores = useRef(new Map<string, ExsurgeScore>());
  const ctxtRef = useRef<ExsurgeContext | null>(null);

  // Desenha todas as lições, uma de cada vez (o exsurge diagrama de forma assíncrona).
  useEffect(() => {
    const container = containerRef.current;
    if (!ex || !container) return;
    if (!ctxtRef.current) {
      ctxtRef.current = new ex.ChantContext();
      configurarContexto(ctxtRef.current, 19);
    }
    const ctxt = ctxtRef.current;
    let cancelado = false;
    let largura = 0;

    const desenhar = (licao: Licao) =>
      new Promise<void>((resolve) => {
        const div = alvos.current.get(licao.id);
        const w = div?.clientWidth ?? 0;
        if (!div || w < 50) return resolve();
        const score = new ex.ChantScore(
          ctxt,
          ex.Gabc.createMappingsFromSource(ctxt, licao.gabc),
          false,
        );
        scores.current.set(licao.id, score);
        score.performLayoutAsync(ctxt, () => {
          score.layoutChantLines(ctxt, w, () => {
            if (!cancelado) {
              div.innerHTML = score.createSvg(ctxt);
              const svg = div.querySelector("svg");
              if (svg) {
                svg.removeAttribute("width");
                svg.removeAttribute("height");
                svg.setAttribute("viewBox", `0 0 ${score.bounds.width} ${score.bounds.height}`);
                svg.setAttribute("role", "img");
                svg.setAttribute("aria-label", `Exemplo: ${licao.titulo}`);
              }
            }
            resolve();
          });
        });
      });

    const desenharTudo = async () => {
      for (const licao of [ALTURAS, ...LICOES]) {
        if (cancelado) return;
        await desenhar(licao);
      }
    };

    let espera: ReturnType<typeof setTimeout> | undefined;
    const obs = new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (container.clientWidth === largura) return;
        largura = container.clientWidth;
        void desenharTudo();
      }, 150);
    });
    obs.observe(container);
    return () => {
      cancelado = true;
      obs.disconnect();
      clearTimeout(espera);
    };
  }, [ex]);

  const ouvir = (licao: Licao) => {
    if (tocandoId === licao.id) return onParar();
    const score = scores.current.get(licao.id);
    if (!ex || !score) return;
    onOuvir(licao.id, extrairEventos(ex, score, transposicao));
  };

  const cartao = (licao: Licao, largo = false) => (
    <article
      key={licao.id}
      className={`flex flex-col rounded-2xl border border-ink/[0.07] bg-white/70 p-4 shadow-sm sm:p-5 ${
        largo ? "md:col-span-2" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl leading-tight text-ink md:text-2xl">{licao.titulo}</h3>
        <button
          type="button"
          onClick={() => ouvir(licao)}
          disabled={!ex}
          aria-label={`${tocandoId === licao.id ? "Parar" : "Ouvir"}: ${licao.titulo}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 text-xs font-semibold text-ink transition hover:border-ink/25 disabled:opacity-45"
        >
          {tocandoId === licao.id ? (
            <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
              <rect x="7" y="6" width="10" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          )}
          {tocandoId === licao.id ? "Parar" : "Ouvir"}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {licao.codigo.map((c) => (
          <code
            key={c}
            className="rounded-md bg-ink px-2 py-1 font-mono text-[0.8rem] text-primary-foreground"
          >
            {c}
          </code>
        ))}
      </div>
      <div className="rounded-xl bg-[#fffdf8] px-3 py-3">
        <div
          ref={(el) => {
            if (el) alvos.current.set(licao.id, el);
          }}
          className="canto-partitura min-h-16 w-full"
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-soft">{licao.texto}</p>
    </article>
  );

  return (
    <div ref={containerRef} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col md:col-span-2">
        {cartao(ALTURAS, true)}
        <ol className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
          {SOLFEJO_C4.map(([letra, nota], i) => (
            <li
              key={i}
              className={`rounded-lg px-1 py-1.5 text-center ${
                letra === "j" ? "bg-[#a33a2c] text-white" : "bg-white/70 text-ink"
              }`}
            >
              <span className="block font-mono text-sm font-semibold">{letra}</span>
              <span className={`block text-[0.7rem] ${letra === "j" ? "" : "text-soft"}`}>
                {nota}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {LICOES.map((l) => cartao(l))}
    </div>
  );
}
