import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// ID de editor do AdSense ativo. O script do AdSense é carregado no __root.tsx.
const ADSENSE_CLIENT = "ca-pub-1156847495220680";
// Opcional: preencha com o ID do bloco de anúncios criado no AdSense (ex.: "1234567890").
const ADSENSE_SLOT = "";
const WAIT_SECONDS = 30;

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
    titulo: "Salmo 24 — Recordai, Senhor, meu Deus (PDF)",
    url: "https://drive.google.com/file/d/1A6wV4WAwm5CPzIdLDfKJJqKDVq1tHq7K/view?usp=drivesdk",
  },
  {
    titulo: "Salmo 24 — Recordai, Senhor, meu Deus (PNG)",
    url: "https://drive.google.com/file/d/1X_5SpyQwN9h1xD2krSl4uGZ5yBnEmPJL/view?usp=drivesdk",
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

function AdSlot() {
  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    // Com o script do AdSense no head, os anúncios automáticos do Google
    // preenchem a página; este espaço fica reservado até criar um bloco de anúncios.
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border text-xs text-soft">
        Espaço publicitário
      </div>
    );
  }
  return (
    <ins
      className="adsbygoogle block min-h-[120px]"
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

function CompositionCard({ titulo, url }: { titulo: string; url: string }) {
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(WAIT_SECONDS);

  useEffect(() => {
    if (!started || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, left]);

  const pct = ((WAIT_SECONDS - left) / WAIT_SECONDS) * 100;

  return (
    <div className="glass-strong space-y-4 rounded-[2rem] p-6 shadow-xl md:p-8">
      <h2 className="font-serif text-2xl text-ink">{titulo}</h2>
      {!started ? (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="block w-full rounded-2xl bg-ink px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
        >
          Baixar partitura
        </button>
      ) : left > 0 ? (
        <div className="space-y-2">
          <p className="text-center text-sm text-soft">
            Seu download será liberado em <strong className="text-ink">{left}s</strong>
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl bg-ink px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
        >
          Abrir partitura ↗
        </a>
      )}
      <AdSlot />
    </div>
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
        <p className="mt-3 text-xs text-soft">
          Os anúncios ajudam a manter as partituras gratuitas. Obrigado!
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
