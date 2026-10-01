import { createFileRoute, Link } from "@tanstack/react-router";

const PARTITURAS: { titulo: string; url: string }[] = [
  {
    titulo: "Missa dos Santos Anjos da Guarda",
    url: "https://drive.google.com/file/d/1tg2ulIulOkog5hk6hz0ZyRybw5iCsSes/view?usp=drivesdk",
  },
  {
    titulo: "Aleluia I",
    url: "https://drive.google.com/file/d/1lNGn8oKH-a-6NoQKt-MgPH9SRhY4KdXB/view?usp=drivesdk",
  },
  {
    titulo: "Salmo 24 — Recordai, Senhor, meu Deus",
    url: "https://drive.google.com/file/d/1A6wV4WAwm5CPzIdLDfKJJqKDVq1tHq7K/view?usp=drivesdk",
  },
  {
    titulo: "Salmo 32",
    url: "https://drive.google.com/file/d/1WsLc8a_UnzqImz0nNbe6P1nNX5GZQepn/view?usp=drivesdk",
  },
  {
    titulo: "Nós somos pastores",
    url: "https://drive.google.com/file/d/1CwDHKZpx4h34HXTFjpSBQ5vu4uPzIXDc/view?usp=drivesdk",
  },
  {
    titulo: "Do casto sois modelo",
    url: "https://drive.google.com/file/d/1J6v_kjypCv3kM1V0aDShj8i5VA412YJF/view?usp=drivesdk",
  },
  {
    titulo: "O Cordeiro que está no meio do trono",
    url: "https://drive.google.com/file/d/1e8rEo7FA1XpKxRJo8SeUOuKrbYQxR0jy/view?usp=drivesdk",
  },
  {
    titulo: "A Virgem Forte",
    url: "https://drive.google.com/file/d/1rihIgHgxfOW3jAmDda7PsmbdDJQScwCs/view?usp=drivesdk",
  },
  {
    titulo: "O Cordeiro que está no meio do trono (Versão de Trabalho / Cópia Crítica)",
    url: "https://drive.google.com/file/d/1GtnXQw6Ac7VzmAoi7wSua9juW828snIe/view?usp=drivesdk",
  },
  {
    titulo: "A Virgem Forte (Versão de Trabalho / Cópia Crítica)",
    url: "https://drive.google.com/file/d/1GuYcEOUU6xvaCU_9yFE151sI8juZL8l1/view?usp=drivesdk",
  },
];

export const Route = createFileRoute("/composicoes")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Composições — Partituras de Wallace Moura" },
      {
        name: "description",
        content:
          "Baixe gratuitamente as partituras das composições do Maestro Wallace Moura: hinos e música litúrgica.",
      },
      { property: "og:title", content: "Composições — Partituras de Wallace Moura" },
      {
        property: "og:description",
        content: "Partituras gratuitas de hinos e música litúrgica do Maestro Wallace Moura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComposicoesPage,
});

function CompositionCard({ titulo, url }: { titulo: string; url: string }) {
  return (
    <article className="glass-strong space-y-4 rounded-[2rem] p-6 shadow-xl md:p-8">
      <h2 className="font-serif text-2xl text-ink">{titulo}</h2>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-2xl bg-ink px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
      >
        Abrir partitura ↗
      </a>
    </article>
  );
}

function ComposicoesPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-ink antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-frost to-sky-100" />
      <div className="pointer-events-none fixed top-1/3 -right-32 -z-10 size-[560px] rounded-full bg-gold/25 blur-[140px]" />

      <main className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="text-sm font-semibold text-slate hover:text-ink">
          ← Maestro Wallace Moura
        </Link>
        <span className="mt-10 block text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Partituras
        </span>
        <h1 className="mt-2 font-serif text-5xl text-ink md:text-6xl">Composições</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-soft">
          Hinos e obras de música litúrgica compostos por Wallace Moura, disponíveis
          gratuitamente para coros, organistas e músicos.
        </p>

        <div className="mt-10 space-y-6">
          {PARTITURAS.map((p) => (
            <CompositionCard key={p.url} titulo={p.titulo} url={p.url} />
          ))}
        </div>
      </main>
    </div>
  );
}
