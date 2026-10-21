import { createFileRoute, Link } from "@tanstack/react-router";
import { CantoGregoriano } from "@/components/CantoGregoriano";

export const Route = createFileRoute("/canto-gregoriano")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Canto Gregoriano — Maestro Wallace Moura" },
      {
        name: "description",
        content:
          "Escreva em GABC, veja a partitura em notação quadrada e ouça a melodia em coro, órgão ou piano. Baixe em MIDI e SVG.",
      },
      { property: "og:title", content: "Canto Gregoriano — Maestro Wallace Moura" },
      {
        property: "og:description",
        content: "Partituras gregorianas que soam: notação quadrada e áudio MIDI no navegador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CantoGregorianoPage,
});

function CantoGregorianoPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-ink antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-frost to-sky-100" />
      <div className="pointer-events-none fixed top-1/3 -right-32 -z-10 size-[560px] rounded-full bg-gold/25 blur-[140px]" />

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
          <Link to="/" className="text-slate hover:text-ink">
            ← Maestro Wallace Moura
          </Link>
          <Link to="/ferramentas-musicais" className="text-soft hover:text-ink">
            Ferramentas musicais
          </Link>
        </nav>

        <span className="mt-10 block text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Canto gregoriano · Notação quadrada
        </span>
        <h1 className="mt-2 font-serif text-5xl leading-[1.02] text-ink md:text-6xl">
          Partituras gregorianas <em className="text-[#a33a2c]">que soam</em>
        </h1>
        <p className="mb-10 mt-4 max-w-xl text-lg leading-relaxed text-soft">
          Escreva em GABC, veja a partitura em neumas e ouça a melodia em coro, órgão ou piano.
          Toque em qualquer nota para começar dali.
        </p>

        <CantoGregoriano />

        <footer className="mt-10 space-y-1 text-sm text-soft">
          <p>© Maestro Wallace Moura</p>
          <p className="text-xs">
            Partitura desenhada com{" "}
            <a
              href="https://github.com/frmatthew/exsurge"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-ink"
            >
              exsurge
            </a>{" "}
            (MIT). Timbres: soundfonts FluidR3 GM.
          </p>
        </footer>
      </main>
    </div>
  );
}
