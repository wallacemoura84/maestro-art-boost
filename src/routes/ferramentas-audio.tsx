import { createFileRoute, Link } from "@tanstack/react-router";
import { ReadingCalculator, Recorder } from "@/components/AudioToolPanels";

export const Route = createFileRoute("/ferramentas-audio")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Ferramentas de Áudio — Maestro Wallace Moura" },
      { name: "description", content: "Gravador de voz online com processamento e calculadora de tempo de leitura para locução." },
      { property: "og:title", content: "Ferramentas de Áudio — Maestro Wallace Moura" },
      { property: "og:description", content: "Grave sua voz, processe o áudio e calcule o tempo de leitura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AudioToolsPage,
});

function AudioToolsPage() {
  return (
    <div className="audio-tools min-h-screen">
      <header className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/" className="text-sm text-[var(--at-label)] hover:text-[var(--at-text)]">← Maestro Wallace Moura</Link>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-12">
        <h1 className="text-4xl font-bold">Ferramentas de Áudio</h1>
        <nav aria-label="Categorias de ferramentas" className="flex flex-wrap gap-2 border-b border-[var(--at-border)] pb-4">
          <Link to="/ferramentas-audio" aria-current="page" className="border-b-2 border-[var(--at-accent)] px-3 py-2 font-semibold text-[var(--at-accent)]">Ferramentas de áudio</Link>
          <Link to="/ferramentas-musicais" className="px-3 py-2 text-[var(--at-label)] hover:text-[var(--at-text)]">Ferramentas musicais</Link>
          <Link to="/canto-gregoriano" className="px-3 py-2 text-[var(--at-label)] hover:text-[var(--at-text)]">Canto gregoriano</Link>
        </nav>
        <Recorder />
        <ReadingCalculator />
      </main>
      <footer className="pb-8 text-center text-xs text-[var(--at-muted)]">© Wallace Moura - Desenvolvido com Lovable</footer>
    </div>
  );
}
