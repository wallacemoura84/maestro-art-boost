import { createFileRoute } from "@tanstack/react-router";

import heroMaestro from "@/assets/hero-maestro.jpg";
import albumMain from "@/assets/album-main.jpg";
import albumCerruti from "@/assets/album-cerruti.jpg";
import albumDulci from "@/assets/album-dulci.jpg";
import alunaAna from "@/assets/aluna-ana.jpg";
import alunoRafael from "@/assets/aluno-rafael.jpg";
import alunaCecilia from "@/assets/aluna-cecilia.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maestro Wallace Moura — Regência, Pesquisa e Educação Musical" },
      {
        name: "description",
        content:
          "Regente, organista da Mitra Arquidiocesana de Belo Horizonte e educador musical. Aulas de piano, regência, teoria, harmonia e preparação para vestibular de música.",
      },
      { property: "og:title", content: "Maestro Wallace Moura" },
      {
        property: "og:description",
        content: "Regência · Pesquisa · Educação Musical — Belo Horizonte, MG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CONTATO = {
  email: "mailto:contato@maestrowallace.art",
  whatsapp: "https://wa.link/875i9h",
  instagram: "https://instagram.com/maestrowallace.art",
  linkedin: "https://www.linkedin.com/in/wallacemouraa/",
  youtube: "https://www.youtube.com/@maestrowallacemoura",
  agendamento: "https://reservahorario.com.br/maestro-wallace-aulas-de-musica",
};

const formacao = [
  {
    numero: "01",
    titulo: "Regência",
    texto:
      "Bacharel em Regência pela UFMG e regente de corais e orquestras em Belo Horizonte.",
  },
  {
    numero: "02",
    titulo: "Regência Coral",
    texto:
      "Pós-graduado em Regência Coral com Capacitação à Docência, com foco em formação e repertório vocal.",
  },
  {
    numero: "03",
    titulo: "Mestrado",
    texto:
      "Mestrando em Música, linha Música e Cultura, pesquisando a difusão latino-americana de Cerruti.",
  },
];

const disciplinas = [
  { nome: "Piano", detalhe: "Técnica e repertório" },
  { nome: "Regência", detalhe: "Batuta e ensaio coral" },
  { nome: "Teoria Musical", detalhe: "Fundamentos e análise" },
  { nome: "Percepção Musical", detalhe: "Ouvido e ditados" },
  { nome: "Harmonia", detalhe: "Progressões e cadências" },
  { nome: "História da Música", detalhe: "Contextos e períodos" },
  { nome: "Preparação Vestibular", detalhe: "Provas de música" },
];

const concertos = [
  {
    dia: "12",
    mes: "mar",
    titulo: "Concerto Sacro — Cerruti",
    local: "Catedral da Sé · 20h",
  },
  {
    dia: "26",
    mes: "abr",
    titulo: "Recital de Regência Coral",
    local: "Teatro Municipal de BH · 19h30",
  },
  {
    dia: "05",
    mes: "mai",
    titulo: "Missa — Dulci Sonum",
    local: "Mitra Arquidiocesana · 19h",
  },
];

const depoimentos = [
  {
    texto:
      "Aprendi regência com um rigor raro e uma paciência que transforma.",
    nome: "Ana Beatriz S.",
    papel: "Aluna de Regência",
    foto: alunaAna,
  },
  {
    texto:
      "Preparou minha prova de harmonia com clareza. Aproveitei no vestibular.",
    nome: "Rafael M.",
    papel: "Vestibular de Música",
    foto: alunoRafael,
  },
  {
    texto:
      "O canal Dulci Sonum e as aulas de teoria me deram uma nova base.",
    nome: "Cecília T.",
    papel: "Pianista",
    foto: alunaCecilia,
  },
];

function Index() {
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
            <a href="#" className="font-serif text-lg tracking-wide text-ink">
              Wallace Moura<span className="text-gold">.</span>
            </a>
            <div className="hidden items-center gap-7 text-sm font-medium text-soft md:flex">
              <a href="#trajetoria" className="hover:text-ink">Trajetória</a>
              <a href="#discografia" className="hover:text-ink">Discografia</a>
              <a href="#pesquisa" className="hover:text-ink">Pesquisa</a>
              <a href="#concertos" className="hover:text-ink">Concertos</a>
            </div>
            <a
              href={CONTATO.agendamento}
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
        <section className="grid items-center gap-10 pt-40 pb-16 md:grid-cols-2">
          <div className="space-y-7">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-soft">
              Regente · Pesquisador · Educador
            </span>
            <h1 className="font-serif text-6xl leading-[0.95] tracking-tight text-ink md:text-7xl">
              Maestro Wallace Moura
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-soft">
              Regente, organista da Mitra Arquidiocesana de Belo Horizonte e
              educador musical. Pesquisa a música sacra de Giuseppe Cerruti na
              América Latina.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={CONTATO.agendamento}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-ink/90"
              >
                Agende uma aula
              </a>
              <a
                href="#aulas"
                className="glass rounded-full px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/70"
              >
                Conheça as aulas
              </a>
            </div>
            <div className="flex gap-4 pt-2 text-xs font-semibold tracking-wide text-soft">
              <span>UFMG</span>
              <span className="text-gold">/</span>
              <span>Regência Coral</span>
              <span className="text-gold">/</span>
              <span>Mestrado em Música</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-slate/30 to-gold/30 blur-xl" />
            <div className="glass-strong overflow-hidden rounded-[2rem] p-2 shadow-2xl">
              <img
                src={heroMaestro}
                alt="Maestro regendo sob luz de palco"
                width={1024}
                height={1280}
                className="aspect-[4/5] w-full rounded-3xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* Trajetória */}
        <section id="trajetoria" className="space-y-8 scroll-mt-28 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Trajetória
              </span>
              <h2 className="mt-2 font-serif text-4xl text-ink">
                Formação e trajetória
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm text-soft md:block">
              Um percurso entre o púlpito, a sala de aula e a pesquisa.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {formacao.map((item) => (
              <div key={item.numero} className="glass rounded-3xl p-6 shadow-sm">
                <p className="font-serif text-5xl text-slate">{item.numero}</p>
                <h3 className="mt-3 font-serif text-2xl text-ink">
                  {item.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-soft">
                  {item.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Discografia */}
        <section id="discografia" className="space-y-8 scroll-mt-28 py-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Discografia
          </span>
          <h2 className="font-serif text-4xl text-ink">
            Gravações e o canal Dulci Sonum
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <img
              src={albumMain}
              alt="Capa de álbum de música sacra"
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square w-full rounded-3xl object-cover"
            />
            <div className="space-y-5">
              <div className="glass flex gap-4 rounded-3xl p-5 shadow-sm">
                <img
                  src={albumCerruti}
                  alt="Capa do álbum Cerruti — Missa Sacra"
                  loading="lazy"
                  width={512}
                  height={512}
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-serif text-xl text-ink">
                    Cerruti — Missa Sacra
                  </h3>
                  <p className="text-sm text-soft">
                    2023 · Coro e Instrumental · 34 min
                  </p>
                </div>
              </div>
              <div className="glass flex gap-4 rounded-3xl p-5 shadow-sm">
                <img
                  src={albumDulci}
                  alt="Capa do álbum Dulci Sonum — Vol. I"
                  loading="lazy"
                  width={512}
                  height={512}
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-serif text-xl text-ink">
                    Dulci Sonum — Vol. I
                  </h3>
                  <p className="text-sm text-soft">
                    2024 · Repertório sacro · canal no YouTube
                  </p>
                </div>
              </div>
              <a
                href={CONTATO.youtube}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink"
              >
                Ouvir no YouTube →
              </a>
            </div>
          </div>
        </section>

        {/* Pesquisa */}
        <section id="pesquisa" className="scroll-mt-28 py-8">
          <div className="glass-strong relative overflow-hidden rounded-[2rem] p-8 shadow-xl md:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Pesquisa acadêmica
                </span>
                <h2 className="font-serif text-4xl leading-tight text-ink">
                  A Seconda Messa de Giuseppe Cerruti na América Latina
                </h2>
                <p className="max-w-xl text-soft">
                  Estudo sobre a difusão e o legado da obra de Cerruti no
                  continente, articulando fontes históricas, manuscritos e a
                  prática coral contemporânea.
                </p>
              </div>
              <div className="glass space-y-3 rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-soft">
                  Itens atuais
                </p>
                <p className="text-sm text-ink">
                  Mestrado em Música — Música e Cultura
                </p>
                <p className="text-sm text-ink">
                  Organista da Mitra Arquidiocesana de BH
                </p>
                <p className="text-sm text-ink">
                  Publicação em andamento sobre repertório sacro
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Aulas */}
        <section id="aulas" className="space-y-8 scroll-mt-28 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Aulas de música
              </span>
              <h2 className="mt-2 font-serif text-4xl text-ink">
                Disciplinas e preparação
              </h2>
            </div>
            <a
              href={CONTATO.agendamento}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-ink/90"
            >
              Agende uma aula
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {disciplinas.map((d) => (
              <div
                key={d.nome}
                className="glass rounded-3xl p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white/60"
              >
                {d.nome}
                <span className="mt-2 block text-xs text-soft">{d.detalhe}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Concertos */}
        <section id="concertos" className="space-y-8 scroll-mt-28 py-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Agenda
          </span>
          <h2 className="font-serif text-4xl text-ink">Próximos concertos</h2>
          <div className="space-y-3">
            {concertos.map((c) => (
              <div
                key={c.titulo}
                className="glass flex flex-col gap-1 rounded-3xl px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink/5 font-serif text-lg text-ink">
                    {c.dia}
                    <span className="block font-sans text-[10px] uppercase tracking-wide text-soft">
                      {c.mes}
                    </span>
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-ink">{c.titulo}</h3>
                    <p className="text-sm text-soft">{c.local}</p>
                  </div>
                </div>
                <a
                  href={CONTATO.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-slate hover:text-ink"
                >
                  Reservar
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Depoimentos */}
        <section className="space-y-8 py-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Depoimentos
          </span>
          <h2 className="font-serif text-4xl text-ink">O que dizem os alunos</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {depoimentos.map((d) => (
              <figure key={d.nome} className="glass rounded-3xl p-6 shadow-sm">
                <blockquote className="font-serif text-lg leading-snug text-ink">
                  “{d.texto}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <img
                    src={d.foto}
                    alt={`Foto de ${d.nome}`}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-ink">{d.nome}</p>
                    <p className="text-soft">{d.papel}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Contato */}
        <section id="contato" className="scroll-mt-28 py-8 pb-20">
          <div className="glass-strong relative overflow-hidden rounded-[2rem] p-8 shadow-xl md:p-12">
            <div className="pointer-events-none absolute -left-16 -bottom-16 size-72 rounded-full bg-slate/20 blur-3xl" />
            <div className="relative grid gap-10 md:grid-cols-2">
              <div className="space-y-5">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Contato
                </span>
                <h2 className="font-serif text-4xl leading-tight text-ink">
                  Agende sua aula com o Maestro
                </h2>
                <p className="max-w-md text-soft">
                  Aulas particulares presenciais e online. Escolha a disciplina
                  e o melhor horário para você.
                </p>
                <div className="space-y-2 text-sm">
                  <a
                    href={CONTATO.email}
                    className="flex items-center gap-3 text-ink hover:text-slate"
                  >
                    <span className="size-2 rounded-full bg-gold" />
                    contato@maestrowallace.art
                  </a>
                  <a
                    href={CONTATO.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-ink hover:text-slate"
                  >
                    <span className="size-2 rounded-full bg-gold" />
                    WhatsApp
                  </a>
                  <a
                    href={CONTATO.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-ink hover:text-slate"
                  >
                    <span className="size-2 rounded-full bg-gold" />
                    Instagram · @maestrowallace.art
                  </a>
                </div>
              </div>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const nome = (form.elements.namedItem("nome") as HTMLInputElement).value;
                  const disciplina = (form.elements.namedItem("disciplina") as HTMLSelectElement).value;
                  const mensagem = (form.elements.namedItem("mensagem") as HTMLTextAreaElement).value;
                  const texto = encodeURIComponent(
                    `Olá, Maestro! Meu nome é ${nome}. Tenho interesse em aulas de ${disciplina}. ${mensagem}`,
                  );
                  window.open(`https://wa.link/875i9h?text=${texto}`, "_blank");
                }}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-soft">
                    Nome
                  </label>
                  <input
                    name="nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    className="glass rounded-2xl px-4 py-3 text-sm text-ink outline-none placeholder:text-soft/70 focus:border-slate/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-soft">
                    Disciplina
                  </label>
                  <select
                    name="disciplina"
                    className="glass rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:border-slate/50"
                  >
                    {disciplinas.map((d) => (
                      <option key={d.nome}>{d.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-soft">
                    Mensagem
                  </label>
                  <textarea
                    name="mensagem"
                    rows={3}
                    placeholder="Conte seus objetivos"
                    className="glass rounded-2xl px-4 py-3 text-sm text-ink outline-none placeholder:text-soft/70 focus:border-slate/50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-ink px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
                >
                  Agende uma aula
                </button>
              </form>
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
          <div className="flex gap-5">
            <a href={CONTATO.instagram} target="_blank" rel="noreferrer" className="hover:text-ink">
              Instagram
            </a>
            <a href={CONTATO.youtube} target="_blank" rel="noreferrer" className="hover:text-ink">
              YouTube
            </a>
            <a href={CONTATO.linkedin} target="_blank" rel="noreferrer" className="hover:text-ink">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
