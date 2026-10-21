import { romano } from "@/lib/gabc";
import {
  CREDOS,
  MISSAS,
  NOMES_PARTES,
  partesDaMissa,
  pecaDaMissa,
  pecaDoCredo,
  type PecaKyriale,
} from "@/lib/kyriale";

type Props = {
  selecionado: string | null;
  carregando: string | null;
  onEscolher: (peca: PecaKyriale) => void;
};

function BotaoPeca({
  peca,
  rotulo,
  ativo,
  carregando,
  onEscolher,
}: {
  peca: PecaKyriale;
  rotulo: string;
  ativo: boolean;
  carregando: boolean;
  onEscolher: (peca: PecaKyriale) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEscolher(peca)}
      aria-pressed={ativo}
      aria-label={`${peca.titulo} — ${peca.subtitulo}`}
      className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
        ativo
          ? "bg-ink text-primary-foreground"
          : "border border-ink/10 bg-white text-ink hover:border-ink/30"
      } ${carregando ? "animate-pulse" : ""}`}
    >
      {rotulo}
    </button>
  );
}

export function BibliotecaKyriale({ selecionado, carregando, onEscolher }: Props) {
  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MISSAS.map((m) => (
          <li
            key={m.numero}
            className="flex flex-col rounded-2xl border border-ink/[0.07] bg-white/70 p-4 shadow-sm"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl leading-none text-[#a33a2c]">
                {romano(m.numero)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-serif text-lg leading-tight text-ink">{m.nome}</p>
                <p className="text-xs text-soft">{m.uso}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {partesDaMissa(m).map((p) => {
                const peca = pecaDaMissa(m, p);
                return (
                  <BotaoPeca
                    key={p}
                    peca={peca}
                    rotulo={NOMES_PARTES[p]}
                    ativo={selecionado === peca.id}
                    carregando={carregando === peca.id}
                    onEscolher={onEscolher}
                  />
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-ink/[0.07] bg-white/70 p-4 shadow-sm">
        <p className="font-serif text-lg text-ink">Credo</p>
        <p className="mb-3 text-xs text-soft">Os seis Credos do Kyriale</p>
        <div className="flex flex-wrap gap-1.5">
          {CREDOS.map((n) => {
            const peca = pecaDoCredo(n);
            return (
              <BotaoPeca
                key={n}
                peca={peca}
                rotulo={`Credo ${romano(n)}`}
                ativo={selecionado === peca.id}
                carregando={carregando === peca.id}
                onEscolher={onEscolher}
              />
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-soft">
        Edição de Solesmes (Graduale Romanum e Liber Usualis, 1961). Transcrições GABC do{" "}
        <a
          href="https://gregobase.selapa.net/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-ink"
        >
          GregoBase
        </a>
        , em domínio público (CC0).
      </p>
    </div>
  );
}
