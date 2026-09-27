import { createFileRoute } from "@tanstack/react-router";

import heroMaestro from "@/assets/wallace-regente.jpg.asset.json";
import albumMain from "@/assets/wallace-orgao-maos.jpg.asset.json";
import { getLatestVideos } from "@/lib/youtube.functions";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Maestro Wallace Moura — Regência, Pesquisa e Educação Musical" },
      {
        name: "description",
        content:
          "Regente, organista da Mitra Arquidiocesana de Belo Horizonte e educador musical. Aulas de piano, regência, teoria, harmonia e preparação para vestibular de música.",
      },
      { property: "og:title", content: "Maestro Wallace Moura — Regência, Pesquisa e Educação Musical" },
      {
        property: "og:description",
        content: "Regência · Pesquisa · Educação Musical — Belo Horizonte, MG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    try {
      return await getLatestVideos();
    } catch {
      // Falha de rede/RPC não deve derrubar a página inteira.
      return [];
    }
  },
  component: Index,
});

const CONTATO = {
  email: "mailto:contato@maestrowallace.art",
  whatsapp: "https://wa.link/875i9h",
  instagram: "https://instagram.com/maestrowallace.art",
  linkedin: "https://www.linkedin.com/in/wallacemouraa/",
  youtube: "https://www.youtube.com/@maestrowallacemoura",
  dulci: "https://www.youtube.com/@dulcisonum",
  novena:
    "https://youtube.com/playlist?list=OLAK5uy_m7_Dk7puVYnj-FCueBpKagLVPlCZZha98",
  isabelCristina: "https://www.youtube.com/watch?v=6yTWbJhfA98",
  seminario: "https://www.youtube.com/watch?v=hM_6ZfGN_gs",
  congressoEucaristico: "https://www.youtube.com/watch?v=w4_RFnnYUBI",
  congressos: "https://www.youtube.com/watch?v=YAMog1c75yQ&list=PLeS-LqFLdJIk",
  lattes: "http://lattes.cnpq.br/9393480660650652",
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
    titulo: "Especialista em Regência Coral",
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
  { nome: "Preparação Vestibular", detalhe: "Provas de música para curso superior ou concursos militares" },
];



const discografia = [
  {
    titulo: "Novena de Nossa Senhora da Boa Morte",
    detalhe: "Gravação sob a regência de Wallace Moura",
    link: CONTATO.novena,
    thumb: "https://i.ytimg.com/vi/rr4IHA3e3AU/mqdefault.jpg",
  },
  {
    titulo: "Hino da Beata Isabel Cristina",
    detalhe: "Composição de Wallace Moura",
    link: CONTATO.isabelCristina,
    thumb: "https://i.ytimg.com/vi/6yTWbJhfA98/mqdefault.jpg",
  },
  {
    titulo: "Hino do Seminário Arquidiocesano de São José",
    detalhe: "Arquidiocese de Mariana/MG · composição de Wallace Moura",
    link: CONTATO.seminario,
    thumb: "https://i.ytimg.com/vi/hM_6ZfGN_gs/mqdefault.jpg",
  },
  {
    titulo: "Hino do 19º Congresso Eucarístico Nacional",
    detalhe: "Composição de Wallace Moura",
    link: CONTATO.congressoEucaristico,
    thumb: "https://i.ytimg.com/vi/w4_RFnnYUBI/mqdefault.jpg",
  },
];

function Index() {
  const loadedVideos = Route.useLoaderData();
  const videos = Array.isArray(loadedVideos) ? loadedVideos : [];
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
              <a href="/teoria-musical" className="hover:text-ink">Curso de música</a>
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
                src={heroMaestro.url}
                alt="Maestro Wallace Moura regendo com a batuta"
                width={853}
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
            Gravações e composições
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <img
              src={albumMain.url}
              alt="Maestro Wallace Moura ao órgão"
              loading="lazy"
              width={1600}
              height={1200}
              className="aspect-square w-full rounded-3xl object-cover md:sticky md:top-28 md:self-start"
            />
            <div className="space-y-5">
              {discografia.map((item) => (
                <a
                  key={item.titulo}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass flex items-center gap-4 rounded-3xl p-5 shadow-sm transition hover:bg-card/70"
                >
                  <img
                    src={item.thumb}
                    alt=""
                    loading="lazy"
                    width={320}
                    height={180}
                    className="size-20 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl text-ink">{item.titulo}</h3>
                    <p className="mt-1 text-xs text-soft">
                      {item.detalhe} · YouTube ↗
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Canal Dulci Sonum */}
        <section id="dulci-sonum" className="space-y-8 scroll-mt-28 py-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Canal no YouTube
          </span>
          <h2 className="font-serif text-4xl text-ink">
            Canal Dulci Sonum — Música Litúrgica
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {videos.length > 0 ? videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass flex items-center gap-4 rounded-3xl p-5 shadow-sm transition hover:bg-card/70"
              >
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  width={320}
                  height={180}
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <h3 className="font-serif text-xl text-ink">{video.title}</h3>
                  <p className="mt-1 text-xs text-soft">
                    {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(video.published))} · YouTube ↗
                  </p>
                </div>
              </a>
            )) : (
              <p className="text-sm leading-relaxed text-soft">
                As próximas publicações do canal aparecerão aqui.
              </p>
            )}
          </div>
          <a
            href={CONTATO.dulci}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink"
          >
            Conheça o canal →
          </a>
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
                   Entre a ausência do original e a performance de cópias: A Seconda Messa de Giuseppe Cerruti e seus testemunhos fragmentários na América do Sul
                </h2>
                <p className="max-w-xl text-soft">
                   Estudo sobre a difusão da Seconda Messa de Cerruti no continente
                   americano, articulando fontes históricas, manuscritos, suas
                   adaptações, hemerografia e a prática coral.
                </p>
              </div>
              <div className="glass space-y-3 rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-soft">
                  Itens atuais
                </p>
                <p className="text-sm text-ink">
                  Mestrado em Música — Música e Cultura
                </p>
                <a
                  href={CONTATO.congressos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink"
                >
                  Participações em congressos (YouTube) →
                </a>
                <a
                  href={CONTATO.lattes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink"
                >
                  Currículo Lattes →
                </a>
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
          <a
            href="/teoria-musical"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink"
          >
            Saiba mais sobre o curso de música do Maestro Wallace Moura →
          </a>
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
              <div className="glass space-y-4 self-start rounded-3xl p-6">
                <p className="text-sm leading-relaxed text-soft">
                  Escolha a disciplina, veja os horários disponíveis e reserve
                  sua aula direto na agenda do Maestro.
                </p>
                <a
                  href={CONTATO.agendamento}
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
