import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const DRIVE_URL =
  "https://drive.google.com/drive/folders/1NkD7fm0SRPCgLZfYa27oUm2fVocImdYH?usp=sharing";
// ID de editor do AdSense ativo. O script do AdSense é carregado no __root.tsx.
const ADSENSE_CLIENT = "ca-pub-1156847495220680";
// Opcional: preencha com o ID do bloco de anúncios criado no AdSense (ex.: "1234567890").
const ADSENSE_SLOT = "";
const WAIT_SECONDS = 30;

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
    if (!ADSENSE_CLIENT) return;
    const id = "adsense-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      document.head.appendChild(s);
    }
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, []);

  if (!ADSENSE_CLIENT) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border text-xs text-soft">
        Espaço publicitário
      </div>
    );
  }
  return (
    <ins
      className="adsbygoogle block min-h-[180px]"
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

function ComposicoesPage() {
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(WAIT_SECONDS);

  useEffect(() => {
    if (!started || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, left]);

  const pct = ((WAIT_SECONDS - left) / WAIT_SECONDS) * 100;

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

        <div className="glass-strong mt-10 space-y-6 rounded-[2rem] p-6 shadow-xl md:p-10">
          {!started ? (
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="block w-full rounded-2xl bg-ink px-6 py-4 text-center text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
            >
              Baixar partituras
            </button>
          ) : left > 0 ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-soft">
                Seu acesso será liberado em <strong className="text-ink">{left}s</strong>
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : (
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-2xl bg-ink px-6 py-4 text-center text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-ink/90"
            >
              Abrir pasta de composições ↗
            </a>
          )}
          <AdSlot />
          <p className="text-center text-xs text-soft">
            Os anúncios ajudam a manter as partituras gratuitas. Obrigado!
          </p>
        </div>
      </main>
    </div>
  );
}
