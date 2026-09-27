import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teoria-musical")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      {
        title: "Curso de Teoria Musical — Maestro Wallace Moura",
      },
      {
        name: "description",
        content:
          "Curso de teoria musical e aulas de música com o Maestro Wallace Moura: piano, teclado, regência coral e orquestral, harmonia, orquestração e história da música. Do iniciante ao avançado, online ou presencial em Belo Horizonte/MG. R$100 a hora-aula.",
      },
      { property: "og:title", content: "Curso de Teoria Musical — Maestro Wallace Moura" },
      {
        property: "og:description",
        content:
          "Piano, teclado, regência, teoria, harmonia e história da música. Do iniciante ao avançado, online ou presencial em Belo Horizonte/MG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeoriaMusical,
});

const AGENDAMENTO = "https://reservahorario.com.br/maestro-wallace-aulas-de-musica";

const disciplinas = [
  {
    nome: "Piano e Teclado",
    detalhe: "Técnica, leitura e repertório, do primeiro contato ao avançado.",
  },
  {
    nome: "Regência Coral e Orquestral",
    detalhe: "Gesto, estudo de partitura e prática de ensaio.",
  },
  {
    nome: "Teoria Musical",
    detalhe: "Fundamentos, notação e análise musical.",
  },
  {
    nome: "Harmonia e Orquestração",
    detalhe: "Progressões, arranjo e escrita para conjuntos.",
  },
  {
    nome: "História da Música",
    detalhe: "Períodos, estilos e contextos.",
  },
  {
    nome: "Preparação para Vestibular e Concursos",
    detalhe:
      "Provas de música para curso superior ou concursos militares.",
  },
];

function TeoriaMusical() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-ink antialiased">
      {/* Fundo em gradiente com brumas de cor */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-frost to-sky-100" />
      <div className="pointer-events-none fixed -top-32 -left-24 -z-10 size-[520px] rounded-full bg-slate/25 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 -right-32 -z-10 size-[560px] rounded-full bg-gold/25 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/4 -z-10 size-[440px] rounded-full bg-sky-200/40 blur-[130px]" />

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-6xl px-5 pt-4">
          <nav className="glass flex items-center justify-between rounded-2xl px-5 py-3 shadow-sm">
            <a href="/" className="font-serif text-lg tracking-wide text-ink">
              Wallace Moura<span className="text-gold">.</span>
            </a>
            <a
              href={AGENDAMENTO}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-ink/90"
            >
              Agende uma aula
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="space-y-7 pt-40 pb-14">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-soft">
            Aulas de música · Online e presencial
          </span>
          <h1 className="max-w-3xl font-serif text-6xl leading-[0.95] tracking-tight text-ink md:text-7xl">
            Curso de teoria musical
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-soft">
            Aulas de música com o Maestro Wallace Moura, regente e educador
            formado pela UFMG. Do iniciante ao avançado — piano, teclado,
            regência coral e orquestral, teoria musical, história da música,
            orquestração e harmonia, além de preparação para vestibular de
            música e concursos militares.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={AGENDAMENTO}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-ink/90"
            >
              Agende uma aula
            </a>
            <a
              href="/"
              className="glass rounded-full px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              ← Voltar ao início
            </a>
          </div>
        </section>

        {/* O que o curso cobre */}
        <section className="space-y-8 py-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              O que o curso cobre
            </span>
            <h2 className="mt-2 font-serif text-4xl text-ink">
              Disciplinas e preparação
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {disciplinas.map((d) => (
              <div
                key={d.nome}
                className="glass rounded-3xl p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white/60"
              >
                <h3 className="font-serif text-xl text-ink">{d.nome}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soft">
                  {d.detalhe}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Formato e preço */}
        <section className="py-10">
          <div className="glass-strong relative overflow-hidden rounded-[2rem] p-8 shadow-xl md:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative grid gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Como funciona
                </span>
                <h2 className="font-serif text-4xl leading-tight text-ink">
                  Formato, níveis e preço
                </h2>
                <ul className="space-y-3 text-sm text-ink">
                  {[
                    "Níveis: do iniciante ao avançado",
                    "Formato: aulas online ou presenciais",
                    "Presencial apenas em Belo Horizonte/MG",
                    "Preço: R$ 100,00 a hora-aula",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass space-y-4 self-start rounded-3xl p-6">
                <p className="text-sm leading-relaxed text-soft">
                  Escolha a disciplina, veja os horários disponíveis e reserve
                  sua aula direto na agenda do Maestro.
                </p>
                <a
                  href={AGENDAMENTO}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-2xl bg-ink px-6 py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
                >
                  Agende uma aula
                </a>
                <p className="text-center text-xs text-soft">
                  reservahorario.com.br/maestro-wallace-aulas-de-musica
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-soft md:flex-row">
          <span className="font-serif text-lg text-ink">
            Wallace Moura<span className="text-gold">.</span>
          </span>
          <p>Belo Horizonte · Minas Gerais</p>
          <p>R$ 100,00 a hora-aula</p>
        </div>
      </footer>
    </div>
  );
}
