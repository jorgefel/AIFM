import Link from "next/link";

export function PromoBanner() {
  return (
    <section className="surface-gradient flex flex-col items-start justify-between gap-6 rounded-[1.75rem] px-8 py-8 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Automatiza tu operación con Pro</h2>
        <p className="mt-1.5 text-sm text-white/95">
          Sincroniza tus canales y deja que el asistente trabaje contigo.
        </p>
      </div>
      <Link
        href="/plans"
        className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-violet-800 transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-white"
      >
        Ver planes
      </Link>
    </section>
  );
}
